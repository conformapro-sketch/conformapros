from pathlib import Path

text = Path('src/pages/VeilleEvaluation.tsx').read_text(encoding='utf-8')
anchor = '<Label className="text-sm font-semibold">Applicabil'
start = text.index(anchor)
end = text.index('                  <div className="space-y-2 rounded-lg border p-4">', start + 50)
print(text[start:end])
