import * as migration_20261030_020023 from './20261030_020023';
import * as migration_20261103_135535_haiboss_editorial from './20261103_135535_haiboss_editorial';
import * as migration_20261103_140921_haiboss_editorial from './20261103_140921_haiboss_editorial';

export const migrations = [
  {
    up: migration_20261030_020023.up,
    down: migration_20261030_020023.down,
    name: '20261030_020023',
  },
  {
    up: migration_20261103_135535_haiboss_editorial.up,
    down: migration_20261103_135535_haiboss_editorial.down,
    name: '20261103_135535_haiboss_editorial',
  },
  {
    up: migration_20261103_140921_haiboss_editorial.up,
    down: migration_20261103_140921_haiboss_editorial.down,
    name: '20261103_140921_haiboss_editorial'
  },
];
