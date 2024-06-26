import { getFromApi } from '../utils/browser-fetch';
import axios from 'axios';

export interface Collection {
  author: string;
  collection_name: string;
  name?: string | null;
  img?: string | null;
  allow_notify?: boolean;
  authorized_accounts?: string[];
  notify_accounts?: string[] | [];
  market_fee?: number;
  created_at_block?: string;
  created_at_time?: string;
  order?: number;
  sales?: string;
  volume?: string;
  data?: {
    img?: string;
    name?: string;
    description?: string;
    url?: string;
  };
}

export const emptyCollection: Collection = {
  author: '',
  collection_name: '',
  name: '',
  img: '',
  allow_notify: false,
  authorized_accounts: [],
  notify_accounts: [],
  market_fee: 0,
  created_at_block: '',
  created_at_time: '',
  data: {
    img: '',
    name: '',
    description: '',
  },
};

export const getCollection = async (
  collectionName: string
): Promise<Collection> => {
  try {
    const result = await getFromApi<Collection>(
      `${process.env.NEXT_PUBLIC_NFT_ENDPOINT}/atomicassets/v1/collections/${collectionName}`
    );

    if (!result.success) {
      throw new Error((result.message as unknown) as string);
    }
    return result.data;
  } catch (e) {
    throw new Error(e);
  }
};
export const getCollectionpagination = async (): Promise<Collection> => {
  try {
    const result = await getFromApi<Collection>(
      `${process.env.NEXT_PUBLIC_NFT_ENDPOINT}/atomicassets/v1/collections`
    );

    if (!result.success) {
      throw new Error((result.message as unknown) as string);
    }
    return result.data;
  } catch (e) {
    throw new Error(e);
  }
};

export const getAuthorsCollections = async (
  author: string
): Promise<Collection[]> => {
  try {
    const result = await getFromApi<Collection[]>(
      `${process.env.NEXT_PUBLIC_NFT_ENDPOINT}/atomicassets/v1/collections?author=${author}`
    );

    if (!result.success) {
      throw new Error((result.message as unknown) as string);
    }
    return result.data;
  } catch (e) {
    throw new Error(e);
  }
};
// export type SearchCollection = {
//   name: string;
//   img: string | null;
// };

/**
 * Get all collection names
 * Mostly fetching collection names for the marketplace search
 * @return {SearchCollection}     Returns indexable object of collection names
 */

// export const getSearchCollections = async (): Promise<SearchCollection[]> => {
//   try {
//     const limit = 100;
//     const collectionsByName: {
//       [name: string]: SearchCollection;
//     } = {};
//     let hasResults = true;
//     let page = 1;

//     while (hasResults) {
//       const result = await getFromApi<Collection[]>(
//         `${process.env.NEXT_PUBLIC_NFT_ENDPOINT}/atomicassets/v1/collections?limit=${limit}&page=${page}`
//       );

//       if (!result.success) {
//         throw new Error((result.message as unknown) as string);
//       }

//       const collections = result.data as Collection[];
//       if (page < 10) {
//         hasResults = false;
//       }

//       for (const collection of collections) {
//         const { collection_name, img } = collection;
//         collectionsByName[collection_name] = {
//           name: collection_name,
//           img,
//         };
//       }

//       page += 1;
//     }

//     return Object.values(collectionsByName);
//   } catch (e) {
//     throw new Error(e);
//   }
// };

// export const CollectionList = async ({ after }) => {
//   try {
//     const result = await axios.post(`/api/collection/list`, {
//       data: {
//         after: after,
//       },
//     });
//     return result.data.data;
//   } catch (e) {
//     // throw new Error(e);
//   }
// };

// export const CollectionListStats = async () => {
//   try {
//     const stats = await axios.post(`/api/collection/stats`);
//     return stats.data.data;
//   } catch (e) {
//     throw new Error(e);
//   }
// };

export const CollectionStats = async (collection) => {
  try {
    const result = await axios.post(`/api/collection/info`, {
      data: {
        collection,
      },
    });
    return result.data.data;
  } catch (e) {
    throw new Error(e);
  }
};

// export const profileStats = async (collection) => {
//   try {
//     const result1 = await axios.post(`/api/collection/info_new`, {
//       data: {
//         collection,
//       },
//     });
//     return result1.data.data;
//   } catch (e) {
//     throw new Error(e);
//   }
// };
