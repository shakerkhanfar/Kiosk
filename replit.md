# Voice-Controlled Kiosk Demo

A voice-controlled food ordering kiosk demo integrating the **Hamsa AI Voice Agent SDK**. Users can navigate a menu and place orders via voice commands.

## Stack

- **Frontend**: React 18 + TypeScript
- **Build tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Voice**: @hamsa-ai/voice-agents-sdk
- **Package manager**: Yarn

## Running the app

```bash
yarn dev
```

The dev server runs on port 5000. The workflow "Start application" (`yarn dev`) is configured in Replit.

## Environment variables

See `.env.example`. All values can also be set at runtime via the in-app **Settings** panel (top-right).

| Variable | Description |
|---|---|
| `VITE_HAMSA_API_KEY` | Hamsa AI API key |
| `VITE_HAMSA_AGENT_ID` | Hamsa voice agent ID |
| `VITE_HAMSA_REGION` | Deployment region: `eu` (default) or `uae` |
| `VITE_KIOSK_PERSONA_NAME` | Assistant persona name shown in UI |
| `VITE_KIOSK_VENDOR_NAME` | Vendor/restaurant name shown in UI |

## User preferences

<!-- Add user preferences here as they are expressed -->
