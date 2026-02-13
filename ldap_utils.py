"""
LDAP Authentication Utilities for Operations Dashboard.
Connects to Active Directory for user authentication.
Falls back to dev-mode auth if ldap3 is not installed.
"""

import logging
import os

logger = logging.getLogger(__name__)

# LDAP Configuration from environment
LDAP_SERVER = os.getenv('LDAP_SERVER', 'ldap://10.14.3.10')
LDAP_SECONDARY_SERVER = os.getenv('LDAP_SECONDARY_SERVER', 'ldap://10.14.3.11')
LDAP_DOMAIN = os.getenv('LDAP_DOMAIN', 'bus.local')
LDAP_BASE_DN = os.getenv('LDAP_BASE_DN', 'DC=bus,DC=local')
LDAP_BIND_USER = os.getenv('LDAP_BIND_USER', '')
LDAP_BIND_PASSWORD = os.getenv('LDAP_BIND_PASSWORD', '')

# Try to import ldap3
try:
    from ldap3 import Server, Connection, ALL, SUBTREE
    LDAP_AVAILABLE = True
except ImportError:
    LDAP_AVAILABLE = False
    logger.warning("ldap3 not installed - using fallback authentication (admin/admin)")


def sanitize_username(raw_username):
    """
    Strip email domain from username input.
    e.g. 'twilcox@proterra.com' -> 'twilcox'
         'twilcox@bus.local' -> 'twilcox'
         'twilcox' -> 'twilcox'
    """
    if not raw_username:
        return ''
    username = raw_username.strip()
    if '@' in username:
        username = username.split('@')[0]
    return username.lower()


def authenticate(username, password):
    """
    Authenticate user against Active Directory.
    Returns True if credentials are valid, False otherwise.
    """
    username = sanitize_username(username)
    
    if not username or not password:
        return False
    
    if not LDAP_AVAILABLE:
        # Fallback for development without ldap3
        logger.warning("LDAP not available, using dev fallback")
        return username == 'admin' and password == 'admin'
    
    # Try primary server, then secondary
    servers = [LDAP_SERVER, LDAP_SECONDARY_SERVER]
    
    for server_url in servers:
        if not server_url:
            continue
        try:
            server = Server(server_url, get_info=ALL, connect_timeout=5)
            
            # Bind with user's domain credentials
            user_dn = f'{username}@{LDAP_DOMAIN}'
            conn = Connection(
                server,
                user=user_dn,
                password=password,
                auto_bind=True,
                read_only=True,
                receive_timeout=10
            )
            
            if conn.bound:
                logger.info(f"User {username} authenticated successfully via {server_url}")
                conn.unbind()
                return True
            
            conn.unbind()
            
        except Exception as e:
            logger.warning(f"LDAP auth failed on {server_url} for {username}: {e}")
            continue
    
    logger.warning(f"All LDAP servers failed for user: {username}")
    return False


def get_user_info(username):
    """
    Look up user display name and email from AD.
    Returns dict with 'displayName' and 'mail', or None if lookup fails.
    """
    username = sanitize_username(username)
    
    if not LDAP_AVAILABLE or not LDAP_BIND_USER or not LDAP_BIND_PASSWORD:
        return {'displayName': username, 'mail': f'{username}@proterra.com'}
    
    servers = [LDAP_SERVER, LDAP_SECONDARY_SERVER]
    
    for server_url in servers:
        if not server_url:
            continue
        try:
            server = Server(server_url, get_info=ALL, connect_timeout=5)
            conn = Connection(
                server,
                user=f'{LDAP_BIND_USER}@{LDAP_DOMAIN}',
                password=LDAP_BIND_PASSWORD,
                auto_bind=True,
                read_only=True,
                receive_timeout=10
            )
            
            conn.search(
                LDAP_BASE_DN,
                f'(sAMAccountName={username})',
                search_scope=SUBTREE,
                attributes=['displayName', 'mail']
            )
            
            if conn.entries:
                entry = conn.entries[0]
                result = {
                    'displayName': str(entry.displayName) if hasattr(entry, 'displayName') else username,
                    'mail': str(entry.mail) if hasattr(entry, 'mail') else f'{username}@proterra.com'
                }
                conn.unbind()
                return result
            
            conn.unbind()
            
        except Exception as e:
            logger.warning(f"LDAP lookup failed on {server_url}: {e}")
            continue
    
    return {'displayName': username, 'mail': f'{username}@proterra.com'}
