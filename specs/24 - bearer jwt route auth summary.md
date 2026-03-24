# Bearer JWT Route Auth Summary

## Közös auth minta

```mermaid
sequenceDiagram
  participant UI
  participant RouteAPI as "Next Route Handler"
  participant VerifyToken as "verifyAccessToken"
  participant AppSyncGraphQL as "Amplify Data GraphQL"
  participant ExternalAPI as "Powens / Blockchain"

  UI->>RouteAPI: HTTP request + Authorization: Bearer accessToken
  RouteAPI->>VerifyToken: verifyAccessToken(accessToken)
  VerifyToken-->>RouteAPI: JWT payload (sub, token_use, client_id)
  RouteAPI->>AppSyncGraphQL: GraphQL query/mutation with Authorization: bearer token
  AppSyncGraphQL-->>RouteAPI: Data record
  opt external side effect
    RouteAPI->>ExternalAPI: create payment / fetch payment / deploy token
    ExternalAPI-->>RouteAPI: result
  end
  RouteAPI->>AppSyncGraphQL: GraphQL mutation with Authorization: bearer token
  AppSyncGraphQL-->>RouteAPI: Updated record
  RouteAPI-->>UI: JSON response
```

## Miért jobb ez

- a route authforrása egyértelmű: a request bearer tokenje
- nincs rejtett szerveroldali Amplify sessionfüggés
- a hibák pontosabban lokalizálhatók
- ugyanaz a JWT megy végig a route authon és az AppSync adathíváson