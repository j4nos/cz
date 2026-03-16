# Amplify compute role CLI setup

Ez a leírás azt dokumentálja, hogyan lett bekötve a `cityzeen-tdd` Amplify Hosting SSR compute role-ja úgy, hogy a Next API route-ok közvetlenül tudjanak DynamoDB `UpdateItem` claimet futtatni a request-state táblákon.

## Miért kellett

A közvetlen DynamoDB claim itt fut:

- [dynamoDbRequestClaimGateway.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/src/infrastructure/gateways/dynamoDbRequestClaimGateway.ts)

És ezeket a Next API route-ok hívják:

- [tokenize-asset route.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/app/api/tokenize-asset/route.ts)
- [mint-ownership route.ts](/Users/kukodajanos/Workspace/cityzeen-tdd/app/api/mint-ownership/route.ts)

Ezért nem az Amplify Data/AppSync jogosultságát kellett bővíteni, hanem az Amplify Hosting `computeRoleArn` role-ját.

## Cél

Az SSR runtime kapjon `dynamodb:UpdateItem` jogot ezekre a táblákra:

- `MintRequest-*`
- `ContractDeploymentRequest-*`

## Használt azonosítók

- app név: `cityzeen-tdd`
- app id: `d22m3ar64zi3nn`
- account id: `767397666295`
- region: `eu-central-1`
- role név: `cityzeen-tdd-amplify-compute-role`

## 1. Trust policy létrehozása

`/tmp/cityzeen-tdd-compute-trust-policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "amplify.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## 2. Inline policy létrehozása

`/tmp/cityzeen-tdd-dynamodb-claims-policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RequestClaimTables",
      "Effect": "Allow",
      "Action": [
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:eu-central-1:767397666295:table/MintRequest-*",
        "arn:aws:dynamodb:eu-central-1:767397666295:table/ContractDeploymentRequest-*"
      ]
    }
  ]
}
```

## 3. Role létrehozása

```bash
aws iam create-role \
  --role-name cityzeen-tdd-amplify-compute-role \
  --assume-role-policy-document file:///tmp/cityzeen-tdd-compute-trust-policy.json
```

Ha már létezik a role, akkor ezt a részt ki lehet hagyni, és mehet csak a policy frissítés.

## 4. Policy felrakása a role-ra

```bash
aws iam put-role-policy \
  --role-name cityzeen-tdd-amplify-compute-role \
  --policy-name cityzeen-tdd-dynamodb-claims \
  --policy-document file:///tmp/cityzeen-tdd-dynamodb-claims-policy.json
```

## 5. Role ARN lekérése

```bash
aws iam get-role \
  --role-name cityzeen-tdd-amplify-compute-role \
  --query 'Role.Arn' \
  --output text
```

Eredmény:

```text
arn:aws:iam::767397666295:role/cityzeen-tdd-amplify-compute-role
```

## 6. Compute role hozzárendelése az Amplify apphoz

```bash
aws amplify update-app \
  --app-id d22m3ar64zi3nn \
  --region eu-central-1 \
  --compute-role-arn arn:aws:iam::767397666295:role/cityzeen-tdd-amplify-compute-role
```

## 7. Ellenőrzés

Role policy:

```bash
aws iam get-role-policy \
  --role-name cityzeen-tdd-amplify-compute-role \
  --policy-name cityzeen-tdd-dynamodb-claims
```

App compute role:

```bash
aws amplify get-app \
  --app-id d22m3ar64zi3nn \
  --region eu-central-1 \
  --query 'app.{appId:appId,name:name,computeRoleArn:computeRoleArn}'
```

Várt eredmény:

```json
{
  "appId": "d22m3ar64zi3nn",
  "name": "cityzeen-tdd",
  "computeRoleArn": "arn:aws:iam::767397666295:role/cityzeen-tdd-amplify-compute-role"
}
```

## Megjegyzés

Ez a jogosultság csak a közvetlen DynamoDB claimre kell. Az olvasás és a normál modell CRUD továbbra is Amplify Data/AppSync útvonalon megy.
