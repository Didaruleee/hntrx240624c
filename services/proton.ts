import ConnectWallet, { ProtonWebLink } from '@proton/web-sdk';
import { ChainId, Link, LinkSession } from '@proton/link';
import { RpcInterfaces } from '@proton/js';
import proton from './proton-rpc';
import { DEFAULT_SCHEMA, TOKEN_PRECISION } from '../utils/constants';
import fees, { MintFee } from '../services/fees';
import { addPrecisionDecimal } from '../utils';

export interface User {
  acc: string;
  actor: string;
  avatar: string;
  name: any;
  isLightKYCVerified: boolean;
  permission: string;
}

interface TransferOptions {
  sender: string;
  recipient: string;
  asset_id: string;
  memo?: string;
}

interface BurnOptions {
  owner: string;
  asset_id: string;
}

interface CreateNftOptions {
  mintFee: MintFee;
  author: string;
  collection_name?: string;
  schema_name: string;
  schema_format: any;
  mutable_data?: any;
  immutable_data : any;
  max_supply: number;
  initial_mint_amount: number;
  collection_market_fee: string;
  collection_description: string;
  collection_display_name: string;
  collection_image: string;
  url: string;
  template_name: string;
  template_description: string,

  
}

interface CreateColOptions {
  author: string;
  collection_name?: string;
  collection_description: string;
  collection_display_name: string;
  collection_image?: string;
  collection_market_fee?: string;
  collection_url?: string;
}

interface CreateTemplateAssetsOptions {
  mintFee: MintFee;
  author: string;
  collection_name: string;
  schema_name: string;
  // max_supply: number;
  initial_mint_amount: number;
  immutable_data: any;
  mutable_data: any;
  schema_format: any;
  template_name: string;
  template_image: string;
  template_video: string,
  template_description:string,
           
}

interface MintAssetsOptions {
  author: string;
  collection_name: string;
  schema_name: string;
  template_id: string;
  mint_amount: number;
  mint_fee: number;
}

interface UpdateCollectionOptions {
  author: string;
  collection_name: string;
  description: string;
  display_name: string;
  image: string;
  market_fee: string;
  // url: string;
}

interface SetMarketFeeOptions {
  author: string;
  collection_name: string;
  market_fee: string;
}

interface CreateSaleOptions {
  seller: string;
  asset_id: string;
  price: string;
  currency: string;
  listing_fee: number;
}

interface CreateMultipleSalesOptions
  extends Omit<CreateSaleOptions, 'asset_id'> {
  assetIds: string[];
}

interface PurchaseSaleOptions {
  buyer: string;
  amount: string;
  sale_id: string;
}


interface BulkSaleOptions {
  buyer: string;
  amount: string;
  ids: string[];
}

interface SaleOptions {
  actor: string;
  sale_id: string;
}

interface CancelMultipleSalesOptions {
  actor: string;
  saleIds: string[];
}

interface DepositWithdrawOptions {
  actor: string;
  amount: string;
}

interface Response {
  success: boolean;
  transactionId?: string;
  error?: string;
}

interface WalletResponse {
  user: User;
  error: string;
}

interface GenerateRamActions {
  author: string;
  mintFee: MintFee;
}

interface Action {
  account: string;
  name: any;
  authorization: Array<{
    actor: string;
    permission: string;
  }>;
  data: unknown;
}

class ProtonSDK {
  appName: string;
  requestAccount: string;
  auth: { actor: string; permission: string } | null;
  link: ProtonWebLink | Link | null | any;
  session: LinkSession | null | any;
  accountData: RpcInterfaces.UserInfo | null;
  chainId: ChainId | null;

  constructor() {
    this.appName = 'HNTRX';
    this.requestAccount = 'HNTRX';
    this.session = null;
    this.auth = null;
    this.link = null;
    this.accountData = null;
    this.chainId = null;
  }

  connect = async ({ restoreSession }): Promise<void> => {
    const { link, session } = await ConnectWallet({
      linkOptions: {
        endpoints: proton.endpoints,
        chainId:
          process.env.NEXT_PUBLIC_NFT_ENDPOINT ===
          'https://test.proton.api.atomicassets.io'
            ? '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd'
            : '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',
        restoreSession,
      },
      transportOptions: {
        requestAccount: this.requestAccount,
      },
      selectorOptions: {
        appName: this.appName,
        customStyleOptions: { 
          modalBackgroundColor: '#FFFFFF',
          logoBackgroundColor: 'white',
          isLogoRound: true,
          optionBackgroundColor: '#F7F8FA',
          optionFontColor: '#052251',
          primaryFontColor: '#052251',
          secondaryFontColor: '#9BA2AD',
          linkColor: '#052251'
        },
      }
    });
    this.link = link;
    this.session = session;
    this.auth = {
      actor: session.auth.actor.toString(),
      permission: session.auth.permission.toString(),
    };

    if (this.auth.actor) {
      this.accountData = await proton.getAccountData(this.auth.actor);
    }
  };

  login = async (): Promise<WalletResponse> => {
    try {
      await this.connect({ restoreSession: false });
      if (!this.session || !this.session.auth) {
        throw new Error('An error has occurred while logging in');
      }
      const { auth } = this.session;
      const isLightKYCVerified = await proton.isAccountLightKYCVerified(
        auth.actor.toString()
      );
      const user = await proton.getUserByChainAccount(auth.actor.toString());

      const chainAccountAvatar = user.avatar
        ? `data:image/jpeg;base64,${user.avatar}`
        : '/default-avatar.png';

      return {
        user: {
          acc: auth.actor.toString(),
          actor: auth.actor.toString(),
          avatar: chainAccountAvatar,
          isLightKYCVerified,
          name: user.name.toString(),
          permission: auth.permission.toString(),
        },
        error: '',
      };
    } catch (e) {
      return {
        user: null,
        error: e.message || 'An error has occurred while logging in',
      };
    }
  };

  logout = async () => {
    await this.link.removeSession(
      this.requestAccount,
      this.session.auth,
      this.chainId
    );
    await window.location.reload();
  };

  restoreSession = async () => {
    try {
      await this.connect({ restoreSession: true });
      if (!this.session || !this.session.auth) {
        throw new Error('An error has occurred while restoring a session');
      }

      const { auth } = this.session;
      const isLightKYCVerified = await proton.isAccountLightKYCVerified(
        auth.actor.toString()
      );
      const user = await proton.getUserByChainAccount(auth.actor.toString());
      const chainAccountAvatar = (await user.avatar)
        ? `data:image/jpeg;base64,${user.avatar}`
        : '/default-avatar.png';

      return {
        user: {
          acc: auth.actor.toString(),
          actor: auth.actor.toString(),
          avatar: chainAccountAvatar,
          isLightKYCVerified,
          name: user.name.toString(),
          permission: auth.permission,
        },
        error: '',
      };
    } catch (e) {
      return {
        user: null,
        error: e.message || 'An error has occurred while restoring a session',
      };
    }
  };

  /**
   * Transfer an asset to another user
   *
   * @param {string}   sender       Chain account of the asset's current owner.
   * @param {string}   recipient    Chain account of recipient of asset to transfer
   * @param {string}   asset_id     ID of the asset being transferred
   * @param {string}   memo         Message to send with transfer
   * @return {Response}             Returns an object indicating the success of the transaction and transaction ID.
   */

  transfer = async ({
    sender,
    recipient,
    asset_id,
    memo,
  
  }: TransferOptions): Promise<Response> => {
    const action = [
      {
        account: 'atomicassets',
        name: 'transfer',
        authorization: [
          {
            actor: sender,
            permission: 'active',
          },
        ],
        data: {
          from: sender,
          to: recipient,
          asset_ids: [asset_id],
          memo: memo || '',
        },
      },
    ];
    try {
      if (!this.session) {
        throw new Error('Must be logged in to transfer an asset');
      }

      const result = await this.session.transact(
        { actions: action },
        { broadcast: true }
      );

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message ||
          'An error has occured while attempting to transfer the asset',
      };
    }
  };

  /**
   * Burn an asset (deletes the asset permanently). If there previously were core tokens backed for this asset, these core tokens are transferred to owner.
   *
   * @param {string}   owner         Chain account of the asset's current owner.
   * @param {string}   asset_id     ID of the asset being transferred
   * @return {Response}             Returns an object indicating the success of the transaction and transaction ID.
   */

  burn = async ({ owner, asset_id }: BurnOptions): Promise<Response> => {
    const action = [
      {
        account: 'atomicassets',
        name: 'burnasset',
        authorization: [
          {
            actor: owner,
            permission: 'active',
          },
        ],
        data: {
          asset_owner: owner,
          asset_id,
        },
      },
    ];
    try {
      if (!this.session) {
        throw new Error('Must be logged in to burn an asset');
      }

      const result = await this.session.transact(
        { actions: action },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(owner);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message ||
          'An error has occurred while attempting to burn the asset',
      };
    }
  };

  /**
   * Withdraw tokens from the marketplace back into user's account
   *
   * @param {string}   actor                chainAccount of user
   * @param {string}   amount               amount of tokens to withdraw (i.e 1.000000 XUSDC)
   * @return {Response}      Returns an object indicating the success of the transaction and transaction ID.
   */

  withdraw = async ({
    actor,
    amount,
  }: DepositWithdrawOptions): Promise<Response> => {
    const action = [
      {
        account: 'atomicmarket',
        name: 'withdraw',
        authorization: [
          {
            actor: actor,
            permission: 'active',
          },
        ],
        data: {
          owner: actor,
          token_to_withdraw: amount,
        },
      },
    ];
    try {
      if (!this.session) {
        throw new Error('Must be logged in to withdraw from the market');
      }

      const result = await this.session.transact(
        { actions: action },
        { broadcast: true }
      );

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message ||
          'An error has occured while attempting to withdraw from the market',
      };
    }
  };

  /**
   * Generate transaction actions for purchasing ram in order to list assets for sale
   *
   * @param {number}     seller       Chain account of the asset's owner.
   * @param {number}     listing_fee  Cost of ram to list a number of assets for sale.
   * @return {Action}                 Returns an array of conditional ram actions.
   */

  generateSaleRamActions = ({
    listing_fee,
    seller,
  }: {
    listing_fee: number;
    seller: string;
  }): Action[] => {
    return listing_fee === 0
      ? []
      : [
          {
            account: 'xtokens',
            name: 'transfer',
            authorization: [
              {
                actor: seller,
                permission: 'active',
              },
            ],
            data: {
              from: seller,
              to: 'specialmint',
              quantity: `${listing_fee.toFixed(6)} XUSDC`,
              memo: 'account',
            },
          },
        ];
  };

  /**
   * Generate transaction actions for initializing a user's storage in the
   * specialmint contract, purchasing account ram, and purchasing specialmint
   * contract ram for special minting assets.
   *
   * @param {string}     author                           Chain account of the collection's author.
   * @param {number}     requiredAccountRam               Amount of ram in order to create a collection, a schema, and a template.
   * @param {number}     requiredSpecialMintContractRam   Amount of ram required to special mint a certain number of assets.
   * @return {Action}                                     Returns an array of conditional ram actions.
   */

  generateRamActions = async ({
    author,
    mintFee,
  }: GenerateRamActions): Promise<Action[]> => {
    const hasInitializedStorage = mintFee.userSpecialMintContractRam !== -1;
    const hasEnoughAccountRam = mintFee.accountRamFee.raw === 0;
    const hasEnoughContractRam = mintFee.specialMintFee.raw === 0;

    return [
      hasInitializedStorage
        ? undefined
        : {
            account: 'specialmint',
            name: 'initstorage',
            authorization: [
              {
                actor: author,
                permission: 'active',
              },
            ],
            data: {
              account: author,
            },
          },
      hasEnoughAccountRam
        ? undefined
        : {
            account: 'xtokens',
            name: 'transfer',
            authorization: [
              {
                actor: author,
                permission: 'active',
              },
            ],
            data: {
              from: author,
              to: 'specialmint',
              quantity: `${mintFee.accountRamFee.raw.toFixed(6)} XUSDC`,
              memo: 'account',
            },
          },
      hasEnoughContractRam
        ? undefined
        : {
            account: 'xtokens',
            name: 'transfer',
            authorization: [
              {
                actor: author,
                permission: 'active',
              },
            ],
            data: {
              from: author,
              to: 'specialmint',
              quantity: `${mintFee.specialMintFee.raw.toFixed(6)} XUSDC`,
              memo: 'contract',
            },
          },
    ].filter((action) => action !== undefined);
  };

  /**
   * Create a collection, a schema, a template, and mint initial assets on Atomic Assets.
   *
   * @param {string}     author                   Chain account of the collection's author.
   * @param {string}     collection_name          Name of the collection on the blockchain.
   * @param {string}     collection_description   Short description of the collection.
   * @param {string}     collection_display_name  Display name of the collection.
   * @param {string}     collection_image         IPFS CID (image hash generated on IPFS).
   * @param {string}     collection_market_fee    Royalty amount owner receives for each asset transaction within the collection.
   * @param {string}     template_name            Name of the template to create.
   * @param {string}     template_image           IPFS CID (image hash generated on IPFS).
   * @param {string}     template_description     Description of the template.
   * @param {string}     max_supply               Maximum amount of child assets that this template can mint (0 if there should not be a maximum).
   * @param {string}     initial_mint_amount      Initial amount of assets to mint.
   * @return {Response}                           Returns an object indicating the success of the transaction and transaction ID.
   */

  createNft = async ({
    mintFee,
    author,
    collection_name,
    schema_name,
    schema_format,
    mutable_data,
    immutable_data,
    max_supply,
    initial_mint_amount,
    collection_market_fee,
    collection_description,
    collection_display_name,
    collection_image,
    url,
    template_name,
  }: CreateNftOptions): Promise<Response> => {

    const ramActions = await this.generateRamActions({
      author,
      mintFee,
    });

    const actions = [
      {
        account: 'atomicassets',
        name: 'createtempl',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          authorized_creator: author,
          collection_name: collection_name,
          schema_name: collection_name,
          transferable: true,
          burnable: true,
          max_supply,
          immutable_data,
        }
      },
      {
        account: 'specialmint',
        name: 'mintlasttemp',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          count: initial_mint_amount,
          creator: author,
          collection_name: collection_name,
          schema_name: collection_name,
          new_asset_owner: author,
          immutable_data: [],
          mutable_data: [...mutable_data],
        },
      },
      {
        account: 'atomicassets',
        name: 'remcolauth',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          collection_name: collection_name,
          account_to_remove: 'specialmint',
        },
      },
    ];


    try {
      console.log('createNft, session? ', this.session);
      if (!this.session) {
        throw new Error(
          'Unable to create and mint a collection, schema, template, and assets without logging in.'
        );
      }


      const result = await this.session.transact(
        {
          actions: [...ramActions, ...actions],
        },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(author);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      console.log(e.message);
      return {
        success: false,
        error:
          e.message ||
          'An error has occurred while creating and minting the collection, schema, template, and assets.',
      };
    }
  };

  
  createCol = async ({
    author,
    collection_name,
    collection_description,
    collection_display_name,
    collection_image,
    collection_market_fee,
    collection_url
  }: CreateColOptions): Promise<Response> => {
    const collection_name_or_author = collection_name || author;
    const actions = [
      {
        account: 'atomicassets',
        name: 'createcol',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          author,
          collection_name: collection_name_or_author,
          allow_notify: true,
          authorized_accounts: [author],
          notify_accounts: [],
          market_fee: collection_market_fee,
          data: [
            {
              key: 'description',
              value: ['string', collection_description],
            },
            {
              key: 'name',
              value: ['string', collection_display_name],
            },
            {
              key: 'img',
              value: ['string', collection_image || ''],
            },
            {
              key: 'url',
              value: ['string', collection_url || ''],
            }
          ],
        },
      },
      {
        account: 'atomicassets',
        name: 'createschema',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          authorized_creator: author,
          collection_name: collection_name,
          schema_name: collection_name,
          schema_format: [
            {
              "name": "name",
              "type": "string"
            }, 
            {
              "name": "desc",
              "type": "string"
            }, 
            {
              "name": "model",
              "type": "string"
            }, 
            {
              "name": "glbthumb",
              "type": "string"
            }, 
            {
              "name": "series",
              "type": "uint16"
            }, 
            {
              "name": "categorie",
              "type": "string"
            }, 
            {
              "name": "image",
              "type": "string"
            }, 
            {
              "name": "audio",
              "type": "string"
            }, 
            {
              "name": "video",
              "type": "string"
            }, 
            {
              "name": "marketplace",
              "type": "string"
            },
          ],
        },
      }
    ];

    try {
      if (!this.session) {
        throw new Error(
          'Unable to create and mint a collection, schema, template, and assets without logging in.'
        );
      }

      const result = await this.session.transact(
        {
          actions: [...actions],
        },
        { broadcast: true }
      );
      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      console.log('createCol Error: ', JSON.stringify(e));
      return {
        success: false,
        error:
          e.message ||
          'An error has occurred while creating and minting the collection, schema, template, and assets.',
      };
    }
  };

  /**
   * Update a collection's data (mutable properties: description, display name, image, and royalty amount).
   *
   * @param {string}   author             Chain account of the collection's author.
   * @param {string}   collection_name    Name of the collection to update.
   * @param {string}   description        Collection's new description.
   * @param {string}   display_name       Collection's new display name.
   * @param {string}   image              Collection's new image.
   * @param {string}   market_fee         Royalty amount owner receives for each asset transaction within the collection.
   * @return {Response}                   Returns an object indicating the success of the transaction and transaction ID.
   */

  updateCollection = async ({
    author,
    collection_name,
    description,
    display_name,
    image,
    market_fee,
    // url,
  }: UpdateCollectionOptions): Promise<Response> => {
    const actions: Action[] = [
      {
        account: 'atomicassets',
        name: 'setcoldata',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          author,
          collection_name,
          data: [
            {
              key: 'description',
              value: ['string', description],
            },
            {
              key: 'name',
              value: ['string', display_name],
            },
            {
              key: 'img',
              value: ['string', image || ''],
            },
            {
              key: 'url',
              value: ['string',  ''],
            },
          ],
        },
      },
    ];

    if (market_fee) {
      actions.push({
        account: 'atomicassets',
        name: 'setmarketfee',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          author,
          collection_name,
          market_fee,
        },
      });
    }

    try {
      if (!this.session) {
        throw new Error('Unable to update a collection without logging in.');
      }
      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );
      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message || 'An error has occurred while updating the collection.',
      };
    }
  };

  createSchema = async ({
    author,
    collection_name,
    schema_name,
    schema_format
  }) => {
    const actions = [{
      account: 'atomicassets',
      name: 'createschema',
      authorization: [
        {
          actor: author,
          permission: 'active',
        },
      ],
      data: {
        authorized_creator: author,
        collection_name: collection_name,
        schema_name,
        schema_format,
      },
    }];

    try {
      if (!this.session) {
        throw new Error('Unable to Create Schema without logging in.');
      }
      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );
      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message || 'An error has occurred while updating the collection.',
      };
    }

  };

  extendSchema = async ({
    author,
    collection_name,
    schema_name,
    schema_format
  }) => {
    const actions = [{
      account: 'atomicassets',
      name: 'extendschema',
      authorization: [
        {
          actor: author,
          permission: 'active',
        },
      ],
      data: {
        authorized_editor: author,
        collection_name: collection_name,
        schema_name,
        schema_format_extension: schema_format,
      },
    }];

    try {
      if (!this.session) {
        throw new Error('Unable to Extend Schema without logging in.');
      }
      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );
      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      console.log(e);
      return {
        success: false,
        error:
          e.message || 'An error has occurred while updating the collection.',
      };
    }

  };
  /**
   * Set a collection's market fee on Atomic Assets.
   *
   * @param {string}   author             Chain account of the collection's author.
   * @param {string}   collection_name    Name of the collection to update.
   * @param {string}   market_fee         Royalty amount owner receives for each asset transaction within the collection.
   * @return {Response}                   Returns an object indicating the success of the transaction and transaction ID.
   */
  setMarketFee = async ({
    author,
    collection_name,
    market_fee,
  }: SetMarketFeeOptions): Promise<Response> => {
    const actions = [
      {
        account: 'atomicassets',
        name: 'setmarketfee',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          author,
          collection_name,
          market_fee,
        },
      },
    ];
    try {
      if (!this.session) {
        throw new Error('Unable to set a market fee without logging in.');
      }
      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );
      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message || 'An error has occurred while setting the market fee.',
      };
    }
  };

  createTemplateAssets = async ({
    mintFee,
    author,
    collection_name,
    schema_name,
    // max_supply,
    initial_mint_amount,
    immutable_data,
    mutable_data,
    schema_format,
    template_name,
  }: CreateTemplateAssetsOptions): Promise<Response> => {
    const ramActions = await this.generateRamActions({
      author,
      mintFee,
    });
    const actions = schema_format.length == 0 ?  [
      {
        account: 'atomicassets',
        name: 'addcolauth',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          collection_name: collection_name,
          account_to_add: 'specialmint',
        },
      },
      {
        account: 'atomicassets',
        name: 'createtempl',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          authorized_creator: author,
          collection_name: collection_name,
          schema_name: schema_name,
          transferable: true,
          burnable: true,
          // max_supply,
          immutable_data: [...immutable_data],
        },
      },
      {
        account: 'specialmint',
        name: 'mintlasttemp',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          count: initial_mint_amount,
          creator: author,
          collection_name: collection_name,
          schema_name: schema_name,
          new_asset_owner: author,
          immutable_data: [],
          mutable_data: [...mutable_data],
        },
      },
      {
        account: 'atomicassets',
        name: 'remcolauth',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          collection_name: collection_name,
          account_to_remove: 'specialmint',
        },
      },
    ] : [
      {
        account: 'atomicassets',
        name: 'extendschema',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          authorized_editor: author,
          collection_name: collection_name,
          schema_name: collection_name,
          schema_format_extension: schema_format,
        },
      },
      {
        account: 'atomicassets',
        name: 'addcolauth',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          collection_name: collection_name,
          account_to_add: 'specialmint',
        },
      },
      {
        account: 'atomicassets',
        name: 'createtempl',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          authorized_creator: author,
          collection_name: collection_name,
          schema_name: schema_name,
          transferable: true,
          burnable: true,
          // max_supply,
          immutable_data: [...immutable_data],
        },
      },
      {
        account: 'specialmint',
        name: 'mintlasttemp',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          count: initial_mint_amount,
          creator: author,
          collection_name: collection_name,
          schema_name: schema_name,
          new_asset_owner: author,
          immutable_data: [],
          mutable_data: [...mutable_data],
        },
      },
      {
        account: 'atomicassets',
        name: 'remcolauth',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          collection_name: collection_name,
          account_to_remove: 'specialmint',
        },
      },
    ]
    try {
      if (!this.session) {
        throw new Error(
          'Unable to create a template and mint assets without logging in.'
        );
      }
      const result = await this.session.transact(
        { actions: [...ramActions, ...actions] },
        { broadcast: true }
      );
      await fees.refreshRamInfoForUser(author);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message ||
          'An error has occurred while creating the template and minting assets.',
      };
    }
  };

  /**
   * Mint template assets on Atomic Assets.
   *
   * @param {string}   author               Chain account of the collection's author.
   * @param {string}   collection_name      Name of the collection on the blockchain.
   * @param {string}   template_id          ID of the asset's template type.
   * @param {number}   mint_amount          Number of assets to mint.
   * @return {Response}                     Returns an object indicating the success of the transaction and transaction ID.
   */

  mintAssets = async ({
    author,
    collection_name,
    schema_name,
    template_id,
    mint_amount,
    mint_fee,
  }: MintAssetsOptions): Promise<Response> => {
    const generateMintAssetAction = (): Action => ({
      account: 'atomicassets',
      name: 'mintasset',
      authorization: [
        {
          actor: author,
          permission: 'active',
        },
      ],
      data: {
        authorized_minter: author,
        collection_name: collection_name,
        schema_name: schema_name,
        template_id,
        new_asset_owner: author,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: [],
      },
    });

    const actions = Array.from({ length: mint_amount }, () =>
      generateMintAssetAction()
    );

    if (mint_fee > 0) {
      actions.unshift({
        account: 'xtokens',
        name: 'transfer',
        authorization: [
          {
            actor: author,
            permission: 'active',
          },
        ],
        data: {
          from: author,
          to: 'specialmint',
          quantity: `${mint_fee.toFixed(6)} XUSDC`,
          memo: 'account',
        },
      });
    }

    try {
      if (!this.session) {
        throw new Error('Unable to mint assets without logging in.');
      }
      const result = await this.session.transact(
        { actions },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(author);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error: e.message || 'An error has occurred while minting the assets.',
      };
    }
  };

  /**
   * Announce an asset sale and create an initial offer for the asset on atomic market.
   *
   * @param {string}   seller       Chain account of the asset's current owner.
   * @param {string}   asset_id     ID of the asset to sell.
   * @param {string}   price        Listing price of the sale (i.e. '1.000000').
   * @param {string}   currency     Token precision (number of decimal points) and token symbol that the sale will be paid in (i.e. '6,XUSDC').
   * @param {string}   listing_fee  Ram payment when a user does not have enough ram to transact.
   * @return {Response}             Returns an object indicating the success of the transaction and transaction ID.
   */

  createSale = async ({
    seller,
    asset_id,
    price,
    currency,
    listing_fee,
  }: CreateSaleOptions): Promise<Response> => {
    const ramActions = this.generateSaleRamActions({
      listing_fee,
      seller,
    });

    const actions = [
      ...ramActions,
      {
        account: 'atomicmarket',
        name: 'announcesale',
        authorization: [
          {
            actor: seller,
            permission: 'active',
          },
        ],
        data: {
          seller,
          asset_ids: [asset_id],
          maker_marketplace: 'dgalaxy',
          listing_price: price,
          settlement_symbol: currency,
        },
      },
      {
        account: 'atomicassets',
        name: 'createoffer',
        authorization: [
          {
            actor: seller,
            permission: 'active',
          },
        ],
        data: {
          sender: seller,
          recipient: 'atomicmarket',
          sender_asset_ids: [asset_id],
          recipient_asset_ids: [],
          memo: 'sale',
        },
      },
    ];

    try {
      if (!this.session) {
        throw new Error('Unable to create a sale offer without logging in.');
      }

      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(seller);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message || 'An error has occurred while creating the sale offer.',
      };
    }
  };

  
  createOffer = async ({
    from,
    memo,
    quantity,
    assetId,
    recipient,
    symbol
  }: any): Promise<Response> => {
    const actions = [
      {
        account: symbol === 'XUSDC' ? 'xtokens' : 'eosio.token',
        name: 'transfer',
        authorization: [
          {
            actor: from,
            permission: 'active',
          },
        ],
        data: {
          from: from,
          memo: 'deposit',
          quantity: quantity,
          to: "atomicmarket",
        },
      },
      {
        account: 'atomicmarket',
        name: 'createbuyo',
        authorization: [
          {
            actor: from,
            permission: 'active',
          },
        ],
        data: {
          asset_ids: [assetId],
          buyer: from,
          maker_marketplace: 'dgalaxy',
          memo: memo,
          price: quantity,
          recipient: recipient,
        },
      },
    ];

    try {
      if (!this.session) {
        throw new Error('Unable to create a offer without logging in.');
      }

      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message || 'An error has occurred while creating the offer.',
      };
    }
  };

  acceptOffer = async ({
    from,
    offerId,
    assetIds,
    price
  }: any): Promise<Response> => {
    const actions = [
      {
        account: 'atomicassets',
        name: 'createoffer',
        authorization: [
          {
            actor: from,
            permission: 'active',
          },
        ],
        data: {
          sender: from,
          recipient: 'atomicmarket',
          sender_asset_ids: [...assetIds],
          recipient_asset_ids: [],
          memo: 'buyoffer',
        },
      },
      {
        account: 'atomicmarket',
        name: 'acceptbuyo',
        authorization: [
          {
            actor: from,
            permission: 'active',
          },
        ],
        data: {
          buyoffer_id: offerId,
          expected_asset_ids: [...assetIds],
          expected_price: `${addPrecisionDecimal(price, 4, true)} XPR`,
          taker_marketplace: 'dgalaxy',
        },
      },
    ];

    try {
      if (!this.session) {
        throw new Error('Unable to accept a offer without logging in.');
      }

      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message || 'An error has occurred while accept the offer.',
      };
    }
  };

  cancelOffer = async ({
    offerId,
    from
  }: any): Promise<Response> => {
    try {
      const actions = [
        {
          account: 'atomicmarket',
          name: 'cancelbuyo',
          authorization: [
            {
              actor: from,
              permission: 'active',
            },
          ],
          data: {
            buyoffer_id: offerId,
          },
        }
      ];
      if (!this.session) {
        throw new Error('Unable to cancel a offer without logging in.');
      }
      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message || 'An error has occurred while cancel the offer.',
      };
    }
  };

  
  declineOffer = async ({
    offerId,
    from
  }: any): Promise<Response> => {

    try {
      const actions = [
        {
          account: 'atomicmarket',
          name: 'declinebuyo',
          authorization: [
            {
              actor: from,
              permission: 'active',
            },
          ],
          data: {
            buyoffer_id: offerId,
            decline_memo: 'declined'
          },
        }
      ];

      if (!this.session) {
        throw new Error('Unable to declined a offer without logging in.');
      }

      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message || 'An error has occurred while declined the offer.',
      };
    }
  };


  
  /**
   * Announce multiple asset sales and create initial offers for the assets on atomic market.
   *
   * @param {string}   seller       Chain account of the asset's current owner.
   * @param {string[]} assetIds     Array of IDs for the assets to sell.
   * @param {string}   price        Listing price of the sale (i.e. '1.000000').
   * @param {string}   currency     Token precision (number of decimal points) and token symbol that the sale will be paid in (i.e. '6,XUSDC').
   * @param {string}   listing_fee  Ram payment when a user does not have enough ram to transact.
   * @param {string}   collection   Collection name of the asset to sell.
   * @return {Response}             Returns an object indicating the success of the transaction and transaction ID.
   */

  createMultipleSales = async ({
    seller,
    assetIds,
    price,
    currency,
    listing_fee,
  }: CreateMultipleSalesOptions): Promise<Response> => {
    const ramActions = this.generateSaleRamActions({
      listing_fee,
      seller,
    });

    const announceSaleActions = assetIds.map((asset_id) => ({
      account: 'atomicmarket',
      name: 'announcesale',
      authorization: [
        {
          actor: seller,
          permission: 'active',
        },
      ],
      data: {
        seller,
        asset_ids: [asset_id],
        maker_marketplace: 'dgalaxy',
        listing_price: price,
        settlement_symbol: currency,
      },
    }));

    const createOfferActions = assetIds.map((asset_id) => ({
      account: 'atomicassets',
      name: 'createoffer',
      authorization: [
        {
          actor: seller,
          permission: 'active',
        },
      ],
      data: {
        sender: seller,
        recipient: 'atomicmarket',
        sender_asset_ids: [asset_id],
        recipient_asset_ids: [],
        memo: 'sale',
      },
    }));

    const actions = [
      ...ramActions,
      ...announceSaleActions,
      ...createOfferActions,
    ];

    try {
      if (!this.session) {
        throw new Error('Unable to create a sale offer without logging in.');
      }

      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(seller);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e.message || 'An error has occurred while creating the sale offer.',
      };
    }
  };

  /**
   * Cancel the announcement of an asset sale and its initial offer on atomic market.
   *
   * @param {string}   actor     Chain account of the asset's current owner.
   * @param {string}   sale_id   ID of the sale to cancel.
   * @return {Response}      Returns an object indicating the success of the transaction and transaction ID.
   */

  cancelSale = async ({ actor, sale_id }: SaleOptions): Promise<Response> => {
    const actions = [
      {
        account: 'atomicmarket',
        name: 'cancelsale',
        authorization: [
          {
            actor,
            permission: 'active',
          },
        ],
        data: {
          sale_id,
        },
      },
    ];

    try {
      if (!this.session) {
        throw new Error('Unable to cancel a sale without logging in.');
      }

      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(actor);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error: e.message || 'An error has occurred while cancelling the sale.',
      };
    }
  };

  /**
   * Cancel the announcements of several asset sales and their initial offers on atomic market.
   *
   * @param {string}   actor      Chain account of the asset's current owner.
   * @param {string[]} saleIds    Array of IDs for the sales to cancel.
   * @return {Response}       Returns an object indicating the success of the transaction and transaction ID.
   */

  cancelMultipleSales = async ({
    actor,
    saleIds,
  }: CancelMultipleSalesOptions): Promise<Response> => {
    const actions = saleIds.map((sale_id) => ({
      account: 'atomicmarket',
      name: 'cancelsale',
      authorization: [
        {
          actor,
          permission: 'active',
        },
      ],
      data: {
        sale_id,
      },
    }));

    try {
      if (!this.session) {
        throw new Error('Unable to cancel a sale without logging in.');
      }

      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(actor);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error: e.message || 'An error has occurred while cancelling the sale.',
      };
    }
  };

  /**
   * Purchase a specific asset for sale.
   *
   * @param {string}   buyer          Buyer of the asset for sale.
   * @param {string[]} amount         Amount to buy the asset for sale.
   * @param {string[]} sale_id        ID of the specific asset sale.
   * @return {Response}               Returns an object indicating the success of the transaction and transaction ID.
   */

  purchaseSale = async ({
    buyer,
    amount,
    sale_id,
  }: PurchaseSaleOptions): Promise<Response> => {
    const actions = [
      {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [
          {
            actor: buyer,
            permission: 'active',
          },
        ],
        data: {
          from: buyer,
          to: 'atomicmarket',
          quantity: `${parseFloat(addPrecisionDecimal(amount, 4, true)).toFixed(4)} XPR`,
          memo: 'deposit',
        },
      },
      {
        account: 'atomicmarket',
        name: 'purchasesale',
        authorization: [
          {
            actor: buyer,
            permission: 'active',
          },
        ],
        data: {
          sale_id,
          buyer,
          intended_delphi_median: 0,
          taker_marketplace: 'dgalaxy',
        },
      },
    ];
    try {
      if (!this.session) {
        throw new Error('Unable to purchase a sale without logging in.');
      }

      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(buyer);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      const message = e.message[0].toUpperCase() + e.message.slice(1);
      return {
        success: false,
        error:
          message || 'An error has occurred while trying to purchase an item.',
      };
    }
  };

  bulkSale = async ({
    buyer,
    amount,
    ids,
  }: BulkSaleOptions): Promise<Response> => {
    const actions = [
      {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [
          {
            actor: buyer,
            permission: 'active',
          },
        ],
        data: {
          from: buyer,
          to: 'atomicmarket',
          quantity: `${parseFloat(addPrecisionDecimal(amount, 4, true)).toFixed(4)} XPR`,
          memo: 'deposit',
        },
      },
      ...ids.map((id) => ({
        account: 'atomicmarket',
        name: 'purchasesale',
        authorization: [
          {
            actor: buyer,
            permission: 'active',
          },
        ],
        data: {
          sale_id: id,
          buyer,
          intended_delphi_median: 0,
          taker_marketplace: 'dgalaxy',
        },
      }))
    ];
    try {
      if (!this.session) {
        throw new Error('Unable to purchase a sale without logging in.');
      }

      const result = await this.session.transact(
        { actions: actions },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(buyer);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      console.log(e);
      const message = e.message[0].toUpperCase() + e.message.slice(1);
      return {
        success: false,
        error:
          message || 'An error has occurred while trying to purchase an item.',
      };
    }
  };
  /**
   * Create an auction for a specific asset.
   *
   * @param {string}   asset_id       ID of the asset to put up for auction.
   * @param {string[]} starting_bid   Minimum starting bid for the auction.
   * @param {string[]} duration       Duration in seconds the asset will be up for auction.
   * @return {Response}               Returns an object indicating the success of the transaction and transaction ID.
   */

  createAuction = async ({
    asset_id,
    starting_bid,
    duration,
  }: {
    asset_id: string;
    starting_bid: string;
    duration: string;
  }): Promise<Response> => {
    try {
      if (!this.session) {
        throw new Error('Unable to create an auction without logging in.');
      }

      const seller = this.session.auth.actor;
      const actions = [
        {
          account: 'atomicmarket',
          name: 'announceauct',
          authorization: [
            {
              actor: seller,
              permission: 'active',
            },
          ],
          data: {
            seller,
            asset_ids: [asset_id],
            starting_bid,
            duration,
            maker_marketplace: 'dgalaxy',
          },
        },
        {
          account: 'atomicassets',
          name: 'transfer',
          authorization: [
            {
              actor: seller,
              permission: 'active',
            },
          ],
          data: {
            from: seller,
            to: 'atomicmarket',
            asset_ids: [asset_id],
            memo: 'auction',
          },
        },
      ];

      const result = await this.session.transact(
        { actions },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(seller);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      const message = e.message[0].toUpperCase() + e.message.slice(1);
      return {
        success: false,
        error:
          message || 'An error has occurred while trying to create an auction.',
      };
    }
  };

  /**
   * Make a bid on an auction for a specific asset.
   *
   * @param {string}   auction_id     ID of the auction to make a bid on.
   * @param {string[]} bid            Bid amount on the auction.
   * @return {Response}               Returns an object indicating the success of the transaction and transaction ID.
   */

  bidOnAuction = async ({
    auction_id,
    bid,
  }: {
    auction_id: string;
    bid: string;
  }): Promise<Response> => {
    try {
      if (!this.session) {
        throw new Error('Unable to bid on an auction without logging in.');
      }
      const bidder = this.session.auth.actor.toString();
      const actions = [
        {
              account: 'eosio.token',
              name: 'transfer',
              authorization: [
                {
                  actor: bidder,
                  permission: 'active',
                },
              ],
              data: {
                from: bidder,
                to: 'atomicmarket',
                quantity: bid,
                memo: 'deposit',
              },
        },
        {
          account: 'atomicmarket',
          name: 'auctionbid',
          authorization: [
            {
              actor: bidder,
              permission: 'active',
            },
          ],
          data: {
            bidder,
            auction_id,
            bid,
            taker_marketplace: 'dgalaxy',
          },
        },
      ].filter((action) => action !== undefined);

      const result = await this.session.transact(
        { actions },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(bidder);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      const message = e.message[0].toUpperCase() + e.message.slice(1);
      return {
        success: false,
        error:
          message || 'An error has occurred while trying to bid on an auction.',
      };
    }
  };

  /**
   * Claim the tokens received in an auction as the seller (can only be done
   * after the auction duration times out).
   *
   * @param {string}   auction_id     ID of the auction to confirm.
   * @return {Response}               Returns an object indicating the success of the transaction and transaction ID.
   */

  claimAuctionSell = async (auctionIds): Promise<Response> => {
    try {
      if (!this.session) {
        throw new Error('Unable to claim an auction without logging in.');
      }
      const seller = this.session.auth.actor.toString();
      const actions = auctionIds.map((id) => {
        return {
          account: 'atomicmarket',
          name: 'auctclaimsel',
          authorization: [
            {
              actor: seller,
              permission: 'active',
            },
          ],
          data: {
            auction_id: id,
          },
        }
      });

      const result = await this.session.transact(
        { actions },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(seller);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      const message = e.message[0].toUpperCase() + e.message.slice(1);
      return {
        success: false,
        error:
          message || 'An error has occurred while trying to claim an auction.',
      };
    }
  };

  /**
   * Claim the asset won in an auction as the buyer (can only be done after the
   * auction duration times out).
   *
   * @param {string}   auction_id     ID of the auction to confirm.
   * @return {Response}               Returns an object indicating the success
   * of the transaction and transaction ID.
   */

  claimAuctionBuy = async (auctionIds): Promise<Response> => {
    try {  
      if (!this.session) {
        throw new Error('Unable to bid on an auction without logging in.');
      }
      const buyer = this.session.auth.actor.toString();
      const actions = auctionIds.map((id) => {
        return {
          account: 'atomicmarket',
          name: 'auctclaimbuy',
          authorization: [
            {
              actor: buyer,
              permission: 'active',
            },
          ],
          data: {
            auction_id: id,
          },
        }
      })
      const result = await this.session.transact(
        { actions },
        { broadcast: true }
      );

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      const message = e.message[0].toUpperCase() + e.message.slice(1);
      return {
        success: false,
        error:
          message || 'An error has occurred while trying to claim an auction.',
      };
    }
  };

  /**
   * Cancel a specific auction.
   *
   * @param {string}   auction_id     ID of the auction to cancel.
   * @return {Response}               Returns an object indicating the success of the transaction and transaction ID.
   */

  cancelAuction = async (auctionIds): Promise<Response> => {
    try {
      if (!this.session) {
        throw new Error('Unable to cancel an auction without logging in.');
      }

      const seller = this.session.auth.actor;
      const actions = auctionIds.map((id) => {
        return {
          account: 'atomicmarket',
          name: 'cancelauct',
          authorization: [
            {
              actor: seller,
              permission: 'active',
            },
          ],
          data: {
            auction_id: id,
          },
        }
      })

      const result = await this.session.transact(
        { actions },
        { broadcast: true }
      );

      await fees.refreshRamInfoForUser(seller);

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      const message = e.message[0].toUpperCase() + e.message.slice(1);
      return {
        success: false,
        error:
          message || 'An error has occurred while trying to cancel an auction.',
      };
    }
  };
  setProfile = async ({ actor, url, name }) => {
    const actions = [
      {
        account: "eosio.proton",
        name: "setuserava",
        authorization: [
          {
            actor,
            permission: "active",
          },
        ],
        data: {
          acc: actor,
          ava: url
        },
      },
      {
        account: "eosio.proton",
        name: "setusername",
        authorization: [
          {
            actor,
            permission: "active",
          },
        ],
        data: {
          acc: actor,
          name: name
        },
      },
    ];

    try {
      if (!this.session) {
        throw new Error("Unable to cancel a sale without logging in.");
      }

      const result = await this.session.transact({
        transaction: {
          actions,
        },
        broadcast: true,
      });

      return {
        success: true,
        transactionId: result.processed.id,
      };
    } catch (e) {
      return {
        success: false,
        error: e.message || "An error has occurred while cancelling the sale.",
      };
    }
  };
}

export default new ProtonSDK();
