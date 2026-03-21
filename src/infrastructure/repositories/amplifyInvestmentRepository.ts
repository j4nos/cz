import type { InvestmentRepository } from "@/src/domain/repositories/investmentRepository";
import type { AssetTokenizationRepository } from "@/src/application/interfaces/tokenizationPorts";
import {
  createAmplifyDataClient,
  type AmplifyDataClient,
  type AmplifyReadAuthMode,
} from "@/src/infrastructure/repositories/amplifyClient";
import { AmplifyAssetRepository } from "@/src/infrastructure/repositories/amplifyAssetRepository";
import { AmplifyBlogRepository } from "@/src/infrastructure/repositories/amplifyBlogRepository";
import { AmplifyCatalogRepository } from "@/src/infrastructure/repositories/amplifyCatalogRepository";
import { AmplifyOrderRepository } from "@/src/infrastructure/repositories/amplifyOrderRepository";
import { AmplifyUserProfileRepository } from "@/src/infrastructure/repositories/amplifyUserProfileRepository";

export class AmplifyInvestmentRepository
  implements InvestmentRepository, AssetTokenizationRepository
{
  private readonly userProfiles;
  private readonly assets;
  private readonly catalog;
  private readonly orders;
  private readonly blog;

  constructor(
    client: AmplifyDataClient = createAmplifyDataClient(),
    readAuthMode?: AmplifyReadAuthMode,
  ) {
    this.userProfiles = new AmplifyUserProfileRepository(client);
    this.assets = new AmplifyAssetRepository(client, readAuthMode);
    this.catalog = new AmplifyCatalogRepository(client, readAuthMode);
    this.orders = new AmplifyOrderRepository(client, readAuthMode);
    this.blog = new AmplifyBlogRepository(client, readAuthMode);
  }

  createUserProfile(input: Parameters<AmplifyUserProfileRepository["createUserProfile"]>[0]) {
    return this.userProfiles.createUserProfile(input);
  }

  getUserProfileById(id: string) {
    return this.userProfiles.getUserProfileById(id);
  }

  updateUserProfile(input: Parameters<AmplifyUserProfileRepository["updateUserProfile"]>[0]) {
    return this.userProfiles.updateUserProfile(input);
  }

  createAsset(input: Parameters<AmplifyAssetRepository["createAsset"]>[0]) {
    return this.assets.createAsset(input);
  }

  getAssetById(id: string) {
    return this.assets.getAssetById(id);
  }

  updateAsset(input: Parameters<AmplifyAssetRepository["updateAsset"]>[0]) {
    return this.assets.updateAsset(input);
  }

  deleteAsset(assetId: string) {
    return this.assets.deleteAsset(assetId);
  }

  updateAssetTokenization(input: Parameters<AmplifyAssetRepository["updateAssetTokenization"]>[0]) {
    return this.assets.updateAssetTokenization(input);
  }

  listAssets() {
    return this.assets.listAssets();
  }

  getContractDeploymentRequestById(id: string) {
    return this.assets.getContractDeploymentRequestById(id);
  }

  createContractDeploymentRequestIfMissing(
    input: Parameters<AmplifyAssetRepository["createContractDeploymentRequestIfMissing"]>[0],
  ) {
    return this.assets.createContractDeploymentRequestIfMissing(input);
  }

  updateContractDeploymentRequest(
    input: Parameters<AmplifyAssetRepository["updateContractDeploymentRequest"]>[0],
  ) {
    return this.assets.updateContractDeploymentRequest(input);
  }

  createListing(input: Parameters<AmplifyCatalogRepository["createListing"]>[0]) {
    return this.catalog.createListing(input);
  }

  getListingById(id: string) {
    return this.catalog.getListingById(id);
  }

  updateListing(input: Parameters<AmplifyCatalogRepository["updateListing"]>[0]) {
    return this.catalog.updateListing(input);
  }

  deleteListing(listingId: string) {
    return this.catalog.deleteListing(listingId);
  }

  listListings() {
    return this.catalog.listListings();
  }

  createProduct(input: Parameters<AmplifyCatalogRepository["createProduct"]>[0]) {
    return this.catalog.createProduct(input);
  }

  getProductById(id: string) {
    return this.catalog.getProductById(id);
  }

  updateProduct(input: Parameters<AmplifyCatalogRepository["updateProduct"]>[0]) {
    return this.catalog.updateProduct(input);
  }

  deleteProduct(productId: string) {
    return this.catalog.deleteProduct(productId);
  }

  listProductsByListingId(listingId: string) {
    return this.catalog.listProductsByListingId(listingId);
  }

  createOrder(input: Parameters<AmplifyOrderRepository["createOrder"]>[0]) {
    return this.orders.createOrder(input);
  }

  getOrderById(id: string) {
    return this.orders.getOrderById(id);
  }

  findOrderByPaymentProviderId(paymentProviderId: string) {
    return this.orders.findOrderByPaymentProviderId(paymentProviderId);
  }

  updateOrder(input: Parameters<AmplifyOrderRepository["updateOrder"]>[0]) {
    return this.orders.updateOrder(input);
  }

  listOrdersByInvestor(investorId: string) {
    return this.orders.listOrdersByInvestor(investorId);
  }

  listOrdersByProvider(providerUserId: string) {
    return this.orders.listOrdersByProvider(providerUserId);
  }

  getMintRequestById(id: string) {
    return this.orders.getMintRequestById(id);
  }

  createMintRequestIfMissing(input: Parameters<AmplifyOrderRepository["createMintRequestIfMissing"]>[0]) {
    return this.orders.createMintRequestIfMissing(input);
  }

  updateMintRequest(input: Parameters<AmplifyOrderRepository["updateMintRequest"]>[0]) {
    return this.orders.updateMintRequest(input);
  }

  listPublishedBlogPosts() {
    return this.blog.listPublishedBlogPosts();
  }

  listBlogPosts() {
    return this.blog.listBlogPosts();
  }

  saveBlogPost(input: Parameters<AmplifyBlogRepository["saveBlogPost"]>[0]) {
    return this.blog.saveBlogPost(input);
  }

  deleteBlogPost(blogId: string) {
    return this.blog.deleteBlogPost(blogId);
  }
}
