import os
import sys

# Deploy root on cPanel
APP_ROOT = '/home/csis3web/hub.csis.or.id'

# Add project to path
if APP_ROOT not in sys.path:
    sys.path.insert(0, APP_ROOT)

# Activate cPanel virtualenv if present
VENV_ACTIVATE = os.path.join(APP_ROOT, 'venv', 'bin', 'activate_this.py')
if os.path.exists(VENV_ACTIVATE):
    exec(open(VENV_ACTIVATE).read(), {'__file__': VENV_ACTIVATE})

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
