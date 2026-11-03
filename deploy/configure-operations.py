# Configure only the existing Haiboss user services; never run as root.
import getpass
if getpass.getuser() != 'codexops': raise SystemExit('Run as the registered codexops user')
from pathlib import Path
import json,subprocess
root=Path('/home/codexops/.config/systemd/user');shared=Path('/home/codexops/apps/haiboss/shared')
for name in ['haiboss-site.service','haiboss-intake.service','haiboss-rebuild.service']:
 f=root/name;text=f.read_text()
 if 'Description=Haiboss ' not in text or 'apps/haiboss/' not in text:raise SystemExit('Unexpected service preserved')
 backup=shared/(name+'.before-db-decoupling')
 if not backup.exists():backup.write_text(text)
 f.write_text(text.replace('Requires=haiboss-postgres.service\n',''))
for name,text in {'haiboss-backup.service': '[Unit]\nDescription=Haiboss isolated database and media backup\nAfter=network.target\n\n[Service]\nType=oneshot\nExecStart=/bin/sh /home/codexops/apps/haiboss/releases/20261103-content-v1/deploy/scheduled-backup.sh\nUMask=0077\nMemoryMax=192M\nCPUQuota=50%\nTimeoutStartSec=300\nRestart=on-failure\nRestartSec=900\nStandardOutput=append:/home/codexops/apps/haiboss/shared/logs/backup.log\nStandardError=append:/home/codexops/apps/haiboss/shared/logs/backup.log\n', 'haiboss-backup.timer': '[Unit]\nDescription=Haiboss daily backup at 02:30 Asia/Shanghai\n\n[Timer]\nOnCalendar=*-*-* 18:30:00 UTC\nPersistent=true\nRandomizedDelaySec=60\nUnit=haiboss-backup.service\n\n[Install]\nWantedBy=timers.target\n'}.items():
 f=root/name
 if f.exists() and f.read_text()!=text:raise SystemExit('Different existing backup unit preserved')
 f.write_text(text);f.chmod(0o600)
for name in ['haiboss-rebuild.service','haiboss-editorial.service']:
 d=root/(name+'.d');d.mkdir(exist_ok=True)
 f=d/'resource-limits.conf';text='[Service]\nMemoryMax=768M\nCPUQuota=40%\n'
 if f.exists() and f.read_text()!=text:raise SystemExit('Different existing resource override preserved')
 f.write_text(text)
subprocess.run(['systemctl','--user','daemon-reload'],check=True)
subprocess.run(['systemctl','--user','enable','--now','haiboss-backup.timer','haiboss-editorial.service'],check=True)
print(json.dumps({'siteAndIntakeDecoupledFromDatabaseLifecycle':True,'dailyBackupTimerEnabled':True,'editorialServiceEnabled':True,'otherProjectsTouched':False}))
