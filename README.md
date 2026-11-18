# Kappy

Monorepo do Kappy, gestor de finanças pessoais.

| Pasta | Projeto | Stack |
|---|---|---|
| [frontend/](frontend/) | Aplicação web (UI) | React + Vite + Tailwind |
| [engine/](engine/) | API backend que alimenta o frontend | Node.js + Express |
| [desktop/](desktop/) | App desktop que empacota o frontend e o engine | Electron |
| [voice/](voice/) | Skill Alexa | Python (AWS Lambda) |

## Desenvolvimento

Cada projeto é independente e tem as suas próprias dependências:

```bash
cd engine   && npm install && npm run dev   # API
cd frontend && npm install && npm run dev   # UI (porto 5173)
cd desktop  && npm install && npm run dev   # Electron (requer os dois acima)
```

O histórico git dos repositórios originais (`kappy-engine`, `kappy-desktop`, `kappy-voice`) foi preservado neste repositório.
