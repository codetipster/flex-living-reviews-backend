// src/services/providers/ExternalReviewProvider.ts
import { injectable, inject } from 'inversify';
import axios, { AxiosInstance } from 'axios';
import { Logger } from '../../utils/Logger';
import appConfig from '../../consts/config';

export interface ExternalReview {
  id: string;
  listingName: string;
  guestName: string;
  publicReview: string;
  reviewCategory: Array<{category: string, rating: number}>;
  submittedAt: string;
  type: string;
  status: string;
  source?: string;
}

export interface ExternalReviewProvider {
  fetchFromHostaway(): Promise<ExternalReview[]>;
  fetchFromGoogle(): Promise<ExternalReview[]>;
}

@injectable()
export class HostawayProvider implements ExternalReviewProvider {
  private axiosInstance: AxiosInstance;

  // Mock data matching your original approach
  private mockReviewsData = [
    {
      id: 7453,
      type: "host-to-guest",
      status: "published",
      rating: null,
      publicReview: "Shane and family are wonderful! Would definitely host again :)",
      reviewCategory: [
        { category: "cleanliness", rating: 10 },
        { category: "communication", rating: 10 },
        { category: "respect_house_rules", rating: 10 }
      ],
      submittedAt: "2020-08-21 22:45:14",
      guestName: "Shane Finkelstein",
      listingName: "2B N1 A - 29 Shoreditch Heights"
    },
    {
      id: 7454,
      type: "guest-to-host",
      status: "published",
      rating: null,
      publicReview: "Amazing location and beautiful apartment. Host was very responsive and helpful throughout our stay.",
      reviewCategory: [
        { category: "cleanliness", rating: 9 },
        { category: "communication", rating: 10 },
        { category: "respect_house_rules", rating: 9 }
      ],
      submittedAt: "2024-01-15 14:30:22",
      guestName: "Maria Rodriguez",
      listingName: "2B N1 A - 29 Shoreditch Heights"
    },
    {
      id: 7455,
      type: "guest-to-host",
      status: "published",
      rating: null,
      publicReview: "I did not like the stay because the apartment was too big.",
      reviewCategory: [
        { category: "cleanliness", rating: 1 },
        { category: "communication", rating: 1 },
        { category: "respect_house_rules", rating: 1 }
      ],
      submittedAt: "2024-01-15 14:30:22",
      guestName: "Ronaldo Assis",
      listingName: "2B N1 A - 29 Shoreditch Heights"
    },
    {
      id: 7456,
      type: "guest-to-host",
      status: "published",
      rating: null,
      publicReview: "Perfect for our business trip. Great workspace and excellent wifi. Highly recommend!",
      reviewCategory: [
        { category: "cleanliness", rating: 8 },
        { category: "communication", rating: 9 },
        { category: "respect_house_rules", rating: 10 }
      ],
      submittedAt: "2024-02-03 09:15:45",
      guestName: "David Chen",
      listingName: "1B E2 B - 15 Canary Wharf Tower"
    },
    {
      id: 7457,
      type: "guest-to-host",
      status: "published",
      rating: null,
      publicReview: "Incredible experience! The property exceeded our expectations. Clean, modern, and in the perfect location.",
      reviewCategory: [
        { category: "cleanliness", rating: 10 },
        { category: "communication", rating: 9 },
        { category: "respect_house_rules", rating: 10 }
      ],
      submittedAt: "2024-01-28 16:22:10",
      guestName: "Emma Thompson",
      listingName: "1B E2 B - 15 Canary Wharf Tower"
    },
    {
      id: 7458,
      type: "guest-to-host",
      status: "published",
      rating: null,
      publicReview: "Great stay overall. The apartment was clean and well-equipped. Minor issue with wifi but host resolved it quickly.",
      reviewCategory: [
        { category: "cleanliness", rating: 9 },
        { category: "communication", rating: 8 },
        { category: "respect_house_rules", rating: 9 }
      ],
      submittedAt: "2024-02-20 11:45:33",
      guestName: "James Wilson",
      listingName: "Studio S3 C - 42 London Bridge"
    }
  ];

  constructor(@inject('Logger') private logger: Logger) {
    this.axiosInstance = axios.create({
      baseURL: appConfig.HOSTAWAY.BASE_URL,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${appConfig.HOSTAWAY.API_KEY}`,
        'Cache-control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });
  }

  async fetchFromHostaway(): Promise<ExternalReview[]> {
    const startTime = Date.now();
    let rawReviews: any[] = [];
    let dataSource = 'mock';

    try {
      this.logger.info('Attempting to fetch from Hostaway API');
      
      const hostawayResponse = await this.axiosInstance.get('/reviews', {
        params: {
          accountId: appConfig.HOSTAWAY.ACCOUNT_ID
        }
      });

      if (hostawayResponse.data && hostawayResponse.data.status === 'success') {
        rawReviews = hostawayResponse.data.result || [];
        dataSource = 'hostaway-api';
        this.logger.info(`Fetched ${rawReviews.length} reviews from Hostaway API`, {
          duration: Date.now() - startTime
        });
      }
    } catch (error: any) {
      this.logger.warn('Hostaway API call failed, falling back to mock data', {
        error: error.message,
        duration: Date.now() - startTime
      });
    }

    // If API call failed or returned no data, use mock data
    if (rawReviews.length === 0) {
      this.logger.info('Using mock data for demonstration');
      rawReviews = this.mockReviewsData;
      dataSource = 'mock-fallback';
    }

    // Transform to match ExternalReview interface
    return rawReviews.map(review => ({
      id: review.id.toString(),
      listingName: review.listingName,
      guestName: review.guestName,
      publicReview: review.publicReview,
      reviewCategory: review.reviewCategory,
      submittedAt: review.submittedAt,
      type: review.type,
      status: review.status,
      source: 'hostaway'
    }));
  }

  async fetchFromGoogle(): Promise<ExternalReview[]> {
    if (!appConfig.GOOGLE.PLACES_API_KEY) {
      this.logger.warn('Google Places API key not configured, skipping Google reviews');
      return [];
    }

    this.logger.info('Google Places API integration not yet implemented');
    return [];
  }
}