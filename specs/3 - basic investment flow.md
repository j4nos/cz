```mermaid
sequenceDiagram
  actor AssetProvider
  participant Platform
  actor Investor
  participant PaymentProvider

  AssetProvider->>Platform: Register user profile
  AssetProvider->>Platform: Create asset
  AssetProvider->>Platform: Create listing
  AssetProvider->>Platform: Create product

  Investor->>Platform: Register user profile
  Investor->>Platform: Select listing
  Investor->>Platform: Start order
  Platform-->>Investor: Create pending payment order
  Investor->>PaymentProvider: Complete payment
  PaymentProvider-->>Platform: Confirm payment
  Platform-->>Investor: Complete order
```
