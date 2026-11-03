"""Stop only Haiboss build processes and their children; never other apps."""
from pathlib import Path
import os,signal,json,sys
base=Path('/home/codexops/apps/haiboss').resolve()
processes={}
for entry in Path('/proc').iterdir():
 if not entry.name.isdigit() or int(entry.name)==os.getpid():continue
 try:
  if entry.stat().st_uid!=os.getuid():continue
  args=entry.joinpath('cmdline').read_bytes().split(b'\0')
  cwd=entry.joinpath('cwd').resolve()
  parent=int(next(x for x in entry.joinpath('status').read_text().splitlines() if x.startswith('PPid:')).split()[1])
  processes[int(entry.name)]={'parent':parent,'match':cwd.is_relative_to(base) and (b'cms:build' in args or (b'build' in args and any(b'/next' in x or b'astro' in x for x in args)))}
 except (OSError,ValueError,StopIteration):continue
targets={pid for pid,data in processes.items() if data['match']}
while True:
 children={pid for pid,data in processes.items() if data['parent'] in targets}
 if children.issubset(targets):break
 targets|=children
dry='--dry-run' in sys.argv
if not dry:
 for pid in sorted(targets,reverse=True):
  try:os.kill(pid,signal.SIGTERM)
  except ProcessLookupError:pass
print(json.dumps({'project':'haiboss','buildPids':sorted(targets),'dryRun':dry,'otherProjectsTouched':False}))
