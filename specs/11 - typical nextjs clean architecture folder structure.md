# Tipikus Clean Architecture könyvtár struktúra Next.js appban

```
src/
│
├── app/                     # Next.js routing
│
├── domain/                  # üzleti logika
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/
│   └── services/
│
├── application/             # use-case layer
│   ├── use-cases/
│   ├── dto/
│   └── interfaces/
│
├── infrastructure/          # külső rendszerek
│   ├── api/
│   ├── repositories/
│   └── storage/
│
├── presentation/            # UI layer
│   ├── components/
│   ├── hooks/
│   ├── view-models/
│   └── pages/
│
├── shared/                  # közös utilok
│   ├── types/
│   ├── constants/
│   └── utils/
│
└── config/
```