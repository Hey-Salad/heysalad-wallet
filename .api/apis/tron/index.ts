import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'tron/unknown (api/6.1.3)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * Get account info by address
   *
   * @throws FetchError<400, types.GetAccountInfoByAddressResponse400> 400
   */
  getAccountInfoByAddress(metadata: types.GetAccountInfoByAddressMetadataParam): Promise<FetchResponse<200, types.GetAccountInfoByAddressResponse200>> {
    return this.core.fetch('/v1/accounts/{address}', 'get', metadata);
  }

  /**
   * Get transaction info by account address
   *
   * @throws FetchError<400, types.GetTransactionInfoByAccountAddressResponse400> 400
   */
  getTransactionInfoByAccountAddress(metadata: types.GetTransactionInfoByAccountAddressMetadataParam): Promise<FetchResponse<200, types.GetTransactionInfoByAccountAddressResponse200>> {
    return this.core.fetch('/v1/accounts/{address}/transactions', 'get', metadata);
  }

  /**
   * List all assets(TRC10 tokens) on chain
   *
   * @throws FetchError<400, types.ListAllAssetsTrc10TokensOnChainResponse400> 400
   */
  listAllAssetsTrc10TokensOnChain(metadata?: types.ListAllAssetsTrc10TokensOnChainMetadataParam): Promise<FetchResponse<200, types.ListAllAssetsTrc10TokensOnChainResponse200>> {
    return this.core.fetch('/v1/assets', 'get', metadata);
  }

  /**
   * Get events by transaction id
   *
   * @throws FetchError<400, types.GetEventsByTransactionIdResponse400> 400
   */
  getEventsByTransactionId(metadata: types.GetEventsByTransactionIdMetadataParam): Promise<FetchResponse<200, types.GetEventsByTransactionIdResponse200>> {
    return this.core.fetch('/v1/transactions/{transactionID}/events', 'get', metadata);
  }

  /**
   * Get events by contract address
   *
   * @throws FetchError<400, types.GetEventsByContractAddressResponse400> 400
   */
  getEventsByContractAddress(metadata: types.GetEventsByContractAddressMetadataParam): Promise<FetchResponse<200, types.GetEventsByContractAddressResponse200>> {
    return this.core.fetch('/v1/contracts/{address}/events', 'get', metadata);
  }

  /**
   * Get asset by id or issuer
   *
   * @throws FetchError<400, types.GetAssetByIdOrIssuerResponse400> 400
   */
  getAssetByIdOrIssuer(metadata: types.GetAssetByIdOrIssuerMetadataParam): Promise<FetchResponse<200, types.GetAssetByIdOrIssuerResponse200>> {
    return this.core.fetch('/v1/assets/{identifier}', 'get', metadata);
  }

  /**
   * NOTE: Multiple assets may have the same name.
   *
   * @summary Get assets by name
   * @throws FetchError<400, types.GetAssetByNameResponse400> 400
   */
  getAssetByName(metadata: types.GetAssetByNameMetadataParam): Promise<FetchResponse<200, types.GetAssetByNameResponse200>> {
    return this.core.fetch('/v1/assets/{name}/list', 'get', metadata);
  }

  /**
   * Get events of latest block
   *
   * @throws FetchError<400, types.GetEventsByLatestBlockResponse400> 400
   */
  getEventsByLatestBlock(metadata?: types.GetEventsByLatestBlockMetadataParam): Promise<FetchResponse<200, types.GetEventsByLatestBlockResponse200>> {
    return this.core.fetch('/v1/blocks/latest/events', 'get', metadata);
  }

  /**
   * Get events by block number
   *
   * @throws FetchError<400, types.GetEventsByBlockNumberResponse400> 400
   */
  getEventsByBlockNumber(metadata: types.GetEventsByBlockNumberMetadataParam): Promise<FetchResponse<200, types.GetEventsByBlockNumberResponse200>> {
    return this.core.fetch('/v1/blocks/{block_number}/events', 'get', metadata);
  }

  /**
   * Get transaction info by contract address
   *
   * @throws FetchError<400, types.GetTransactionInfoByContractAddressResponse400> 400
   */
  getTransactionInfoByContractAddress(metadata: types.GetTransactionInfoByContractAddressMetadataParam): Promise<FetchResponse<200, types.GetTransactionInfoByContractAddressResponse200>> {
    return this.core.fetch('/v1/contracts/{contractAddress}/transactions', 'get', metadata);
  }

  /**
   * Get TRC20 token holder balances
   *
   * @throws FetchError<400, types.GetTrc20TokenHolderBalancesResponse400> 400
   */
  getTrc20TokenHolderBalances(metadata: types.GetTrc20TokenHolderBalancesMetadataParam): Promise<FetchResponse<200, types.GetTrc20TokenHolderBalancesResponse200>> {
    return this.core.fetch('/v1/contracts/{contractAddress}/tokens', 'get', metadata);
  }

  /**
   * Get the historical TRC20, TRC721 transfer records and authorization records of an
   * account
   *
   * @summary Get contract transaction info by account address
   * @throws FetchError<400, types.GetTrc20TransactionInfoByAccountAddressResponse400> 400
   */
  getTrc20TransactionInfoByAccountAddress(metadata: types.GetTrc20TransactionInfoByAccountAddressMetadataParam): Promise<FetchResponse<200, types.GetTrc20TransactionInfoByAccountAddressResponse200>> {
    return this.core.fetch('/v1/accounts/{address}/transactions/trc20', 'get', metadata);
  }

  /**
   * Get internal transactions by address
   *
   * @throws FetchError<400, types.GetInternalTransactionsByAddressResponse400> 400
   */
  getInternalTransactionsByAddress(metadata: types.GetInternalTransactionsByAddressMetadataParam): Promise<FetchResponse<200, types.GetInternalTransactionsByAddressResponse200>> {
    return this.core.fetch('/v1/accounts/{address}/internal-transactions', 'get', metadata);
  }

  /**
   * Get internal transactions by transaction ID
   *
   * @throws FetchError<400, types.GetInternalTransactionsByTransactionidResponse400> 400
   */
  getInternalTransactionsByTransactionid(metadata: types.GetInternalTransactionsByTransactionidMetadataParam): Promise<FetchResponse<200, types.GetInternalTransactionsByTransactionidResponse200>> {
    return this.core.fetch('/v1/transactions/{transactionId}/internal-transactions', 'get', metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { GetAccountInfoByAddressMetadataParam, GetAccountInfoByAddressResponse200, GetAccountInfoByAddressResponse400, GetAssetByIdOrIssuerMetadataParam, GetAssetByIdOrIssuerResponse200, GetAssetByIdOrIssuerResponse400, GetAssetByNameMetadataParam, GetAssetByNameResponse200, GetAssetByNameResponse400, GetEventsByBlockNumberMetadataParam, GetEventsByBlockNumberResponse200, GetEventsByBlockNumberResponse400, GetEventsByContractAddressMetadataParam, GetEventsByContractAddressResponse200, GetEventsByContractAddressResponse400, GetEventsByLatestBlockMetadataParam, GetEventsByLatestBlockResponse200, GetEventsByLatestBlockResponse400, GetEventsByTransactionIdMetadataParam, GetEventsByTransactionIdResponse200, GetEventsByTransactionIdResponse400, GetInternalTransactionsByAddressMetadataParam, GetInternalTransactionsByAddressResponse200, GetInternalTransactionsByAddressResponse400, GetInternalTransactionsByTransactionidMetadataParam, GetInternalTransactionsByTransactionidResponse200, GetInternalTransactionsByTransactionidResponse400, GetTransactionInfoByAccountAddressMetadataParam, GetTransactionInfoByAccountAddressResponse200, GetTransactionInfoByAccountAddressResponse400, GetTransactionInfoByContractAddressMetadataParam, GetTransactionInfoByContractAddressResponse200, GetTransactionInfoByContractAddressResponse400, GetTrc20TokenHolderBalancesMetadataParam, GetTrc20TokenHolderBalancesResponse200, GetTrc20TokenHolderBalancesResponse400, GetTrc20TransactionInfoByAccountAddressMetadataParam, GetTrc20TransactionInfoByAccountAddressResponse200, GetTrc20TransactionInfoByAccountAddressResponse400, ListAllAssetsTrc10TokensOnChainMetadataParam, ListAllAssetsTrc10TokensOnChainResponse200, ListAllAssetsTrc10TokensOnChainResponse400 } from './types';
