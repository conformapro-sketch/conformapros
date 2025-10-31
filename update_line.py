# -*- coding: utf-8 -*-
from pathlib import Path

path = Path('src/pages/VeilleEvaluation.tsx')
lines = path.read_text(encoding='utf-8').splitlines()
old_line = "                    <Button onClick={handleCreateActionClick}>Crr le plan d'action</Button>"
new_line = "                    <Button onClick={handleCreateActionClick} disabled={actionTitre.trim().length == 0 or isCreatingAction}>{isCreatingAction ? 'Création...' : 'Créer le plan d'action'}</Button>"
for idx, line in enumerate(lines):
    if line == old_line:
        lines[idx] = new_line
        break
else:
    raise SystemExit('target line not found')
path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
