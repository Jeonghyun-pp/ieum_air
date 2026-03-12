# Airbnb Listing Optimization: Research Report

This report is based on structured research of Airbnb's own documentation, Airbnb engineering publications, academic papers, real commercial optimization services, and public datasets. All findings are sourced.

---

## 1. Airbnb Ranking Algorithm Signals

### 1.1 Core Ranking Mechanism

Airbnb assigns every listing an internal **"probability of booking" score** that determines its search position. This is a machine-learned prediction shaped by dozens of signals. At the 2025 Airbnb Professional Host Summit, Airbnb confirmed that listings now rank based on two key signals:

1. **How likely a guest is to book**
2. **How likely they are to leave a 5-star review**

Source: [Airbnb Help Center - How search results work](https://www.airbnb.com/help/article/39), [Rental Scale-Up](https://www.rentalscaleup.com/how-to-rank-higher-on-airbnb-booking-probability-and-guest-satisfaction-now-drive-visibility/)

### 1.2 The Four Primary Signal Categories

Airbnb's official help documentation explicitly lists four primary categories:

**Quality**
- Listing content (photos, videos)
- Ratings and reviews from guests
- Host-guest communications on platform
- Listing characteristics (amenities, property features)
- Customer service and cancellation history

**Popularity**
- Wishlist saves by guests
- Booking frequency
- Message inquiries to hosts
- Overall guest engagement patterns (clicks, views)

**Price**
- Total listing price
- Price comparison to similar local listings for given dates
- Alignment with guest capacity and amenities

**Location**
- Proximity to popular landmarks
- Guest preference for specific areas

Source: [Airbnb Help Center - Article 39](https://www.airbnb.com/help/article/39)

### 1.3 The 15 Specific Ranking Metrics (by Impact)

Based on industry analysis from Airbnb Smart and cross-referenced with multiple optimization services:

| Rank | Factor | Evidence |
|------|--------|----------|
| 1 | **Click-Through Rate (CTR)** | Clicks / Impressions. Cover photo is the primary CTR driver. |
| 2 | **Booking Conversion Rate** | A listing converting at 5% (50 bookings / 1000 views) outranks one at 0.1%. Airbnb values listings that convert views into bookings efficiently. |
| 3 | **Guest Favorites Badge** | Replaced Superhost as the top badge in 2025. Worth ~25% of ranking weight. |
| 4 | **Review Quality & Quantity** | Individual category scores (cleanliness, accuracy, check-in) weighted ~2x heavier than overall rating. One bad cleanliness review can drop position 10-20 places. |
| 5 | **Price Competitiveness** | Algorithm compares total cost to similar listings in area for same dates. Below-market pricing ranks higher. |
| 6 | **Instant Book** | Airbnb states: "Instant Book listings get a boost." Estimated 15-25% higher in search results. |
| 7 | **Response Rate & Time** | Must respond to 90%+ messages. Average response time under 1 hour is the target. Airbnb confirms: "Responding within 24 hours will boost your ranking." |
| 8 | **Wishlist Saves** | Each wishlist save is a positive ranking signal validating listing appeal. |
| 9 | **Listing Completeness** | Algorithm evaluates word count, description depth, and spelling accuracy to assign quality scores. All fields must be filled. |
| 10 | **Photo Count & Quality** | 15-20+ photos minimum. Professional photos increase bookings ~40%. Landscape orientation displays better. |
| 11 | **Amenities Count** | More amenities = more filter matches = more search visibility. Rare amenities (e.g., EV charger) provide outsized impact. |
| 12 | **Calendar Availability** | More available dates = more search result appearances. Minimum night reduction increases search match. |
| 13 | **Cancellation Rate** | Low host cancellation rate is a trust signal. Part of Superhost criteria. |
| 14 | **Verification Level** | Complete ID verification, government documents, social media connections boost trust signals. |
| 15 | **Location Desirability** | Proximity to popular landmarks and guest-preferred areas. Limited host control. |

Source: [Airbnb Smart - 15 Ranking Metrics](https://airbnbsmart.com/airbnb-ranking-strategy/), [Triad Vacation Rentals - Algorithm 2025](https://triadvacationrentals.com/blog/airbnb-algorithm-and-how-to-rank-higher)

### 1.4 2025 Algorithm Overhaul

Key changes from Airbnb's 2025 Summer Release:

- **New Listing Boost removed**: New properties no longer get temporary ranking advantage.
- **Guest Favorites replaced Superhost** as the top badge.
- **Personalization is primary**: Results tailor to individual guest history. A repeat pet-owner sees pet-friendly properties first. Business travelers see workspaces.
- **Review content matters**: Not only the rating but the content of recent reviews is heavily weighted.
- **Recency bias**: Algorithm shifted from historical performance toward recent guest satisfaction.

Source: [Homesberg - Algorithm 2025 Update](https://www.homesberg.com/en/airbnb-algorithm-2025-update-what-to-know/)

### 1.5 Technical Architecture (from Airbnb Engineering)

Airbnb's search ranking system has evolved through distinct stages:

1. **Pre-2015**: Manually tuned scoring functions
2. **2015**: Gradient Boosted Decision Tree (GBDT) model
3. **2016-2018**: Neural network experiments
4. **2018+**: Deep neural network (published at KDD 2019)

The KDD 2018 paper ("Real-time Personalization using Embeddings for Search Ranking") describes:
- Listing embeddings learned from **800 million search click sessions** across **4.5 million active listings**
- Skip-gram model adapted for marketplace
- Training labels: booked=1.0, host contacted=0.25, host rejected=-0.4, clicked=0.01, viewed=0.0
- Online A/B test result: **CTR increased 23%**

The model uses **over 100 signals** to decide listing rank, and search ranking + similar listings drive **99% of booking conversions**.

Source: [KDD 2018 Paper](https://dl.acm.org/doi/10.1145/3219819.3219885), [Airbnb Engineering Blog - Listing Embeddings](https://medium.com/airbnb-engineering/listing-embeddings-for-similar-listing-recommendations-and-real-time-personalization-in-search-601172f7603e), [arXiv:1810.09591 - Applying Deep Learning To Airbnb Search](https://arxiv.org/abs/1810.09591)

---

## 2. Real Optimization Services

### 2.1 RankBreeze

**What it does**: Airbnb SEO and listing optimization platform.

**Data collected & analyzed**:
- Daily search rankings for listings by guest count and date
- Available dates ranking (6 upcoming available dates, visibility by guest count)
- Competitor listing data (pricing, photos, amenities, occupancy, profit estimates)
- Local market keyword data

**Optimization outputs**:
- **Amenities Analyzer**: Scans 10,000+ listings to identify which amenities are popular in your specific city. Shows which competitor amenities you're missing.
- **Photo Optimizer**: Side-by-side comparison of your photos vs. competitors. Suggestions for improvement.
- **Review Analyzer**: Analyzes review content for strengths and weaknesses.
- **Keyword Ideas**: Optimization hub showing keywords to include in titles and descriptions.
- **Pricing Calendar**: Tracks competitor prices, shows what competitors were booked at.
- **SEO Campaigns**: Sends real users to click on listings to improve CTR metrics.

Source: [RankBreeze](https://rankbreeze.com/), [RankBreeze Features](https://rankbreeze.com/features/)

### 2.2 AutoRank

**What it does**: AI-powered automatic listing optimization.

**Data collected & analyzed**:
- Data from millions of listings
- Local market trends and competitor strategies
- Guest search behavior and preferences
- Top-performing keywords per market
- All guest reviews for the property

**Optimization outputs**:
- **Title optimization**: Combines most-searched keywords + ranking criteria + current title to generate optimized titles.
- **Description optimization**: AI-generated descriptions highlighting unique selling points with consistent tone.
- **Review Fusion**: Analyzes every guest review to extract top attributes, weaves them into listing.
- **Weekly updates**: Automatically updates listings every 7 days to match evolving search trends.
- **Concierge service**: Human experts run AI algorithms + photo optimization + ranking dashboard.

Source: [AutoRank](https://www.autorank.com), [AutoRank Product Overview](https://www.autorank.com/product-overview)

### 2.3 AirDNA (MarketMinder)

**What it does**: Market data analytics platform for short-term rentals.

**Data collected & analyzed**:
- **Average Revenue** per listing
- **ADR (Average Daily Rate)** of booked nights
- **Occupancy Rate**
- **RevPAR** (Revenue Per Available Room) = ADR x Occupancy Rate
- **Reservation lead time**
- **Supply and demand** metrics by market

**Optimization outputs**:
- **Comp Set Analysis**: Create custom comparable set for your property. Evaluate performance vs. comps on occupancy, booked rate, lead time.
- **Monthly Comp**: Occupancy and RevPAR metrics across primary market and 10 comp markets.
- **Monthly Comp Plus**: Supply, demand, and revenue for comp markets.
- **Performance Dashboard**: 12-month trend charts for ADR, occupancy, revenue.
- **Market Explorer**: Navigate and compare entire markets.

Source: [AirDNA](https://www.airdna.co/), [AirDNA Comp Set Help](https://help.airdna.co/en/articles/11114494-comp-set-management-and-analysis)

### 2.4 PriceLabs

**What it does**: Dynamic pricing and revenue management.

**Core algorithm - Hyper Local Pulse (HLP)**:
- Defines comp set: **350 similar-sized nearby listings** within max 15km radius (radius determined dynamically)
- Detects: seasonality, day-of-week patterns, events/holidays, booking pace, lead time
- Ingests: booking pace, seasonal patterns, local events, competitor rates, weather, flight data
- Consolidates: active bookings/cancellations, real-time availability, local event calendars, comp-set rates, weather, OTA/channel performance, CRM segments
- Prices recalculated **daily** and synced via 150+ PMS integrations
- Forward-looking: reacts to future signals, not just past data

Source: [PriceLabs Dynamic Pricing](https://hello.pricelabs.co/dynamic-pricing/), [PriceLabs Algorithm Part 1](https://hello.pricelabs.co/overview-of-pricelabs-dynamic-pricing-algorithm-part-1/)

### 2.5 Service Comparison Matrix

| Service | Pricing | SEO/Keywords | Photos | Amenities | Reviews | Market Data |
|---------|---------|-------------|--------|-----------|---------|-------------|
| RankBreeze | Competitor tracking | Keywords + campaigns | Photo comparison | Analyzer | Review analyzer | Market research |
| AutoRank | - | AI title/description | Photo optimization | - | Review fusion | Competitor analysis |
| AirDNA | RevPAR/ADR analytics | - | - | - | - | Full market data |
| PriceLabs | Dynamic pricing engine | - | - | - | - | Comp set + demand |

---

## 3. Data Used for Optimization

### 3.1 InsideAirbnb Dataset (Public)

The InsideAirbnb dataset is the primary public data source. Available for cities worldwide, updated quarterly, free to download.

**Complete field list (v4.3)**:

**Listing Content Fields**:
- `name` - Listing title
- `description` - Detailed property description
- `neighborhood_overview` - Host's area description
- `picture_url` - Primary image URL
- `property_type` - Dwelling classification
- `room_type` - Entire home / private room / shared / hotel
- `amenities` - Facility features (JSON array)
- `accommodates` - Max guest capacity
- `bedrooms`, `beds`, `bathrooms`, `bathrooms_text`

**Host Fields**:
- `host_since` - Account creation date
- `host_response_time` - Speed category
- `host_response_rate` - Percentage
- `host_acceptance_rate` - Booking acceptance rate
- `host_is_superhost` - Boolean
- `host_listings_count` / `host_total_listings_count`
- `host_has_profile_pic`, `host_identity_verified`
- `host_about` - Biography text

**Pricing Fields**:
- `price` - Nightly rate in local currency
- `minimum_nights` / `maximum_nights`
- `minimum_minimum_nights` through `maximum_maximum_nights` (365-day forecast variants)

**Availability Fields**:
- `availability_30` / `availability_60` / `availability_90` / `availability_365` - Days available in each window
- `has_availability`, `calendar_updated`, `calendar_last_scraped`
- `instant_bookable` - Boolean

**Review Fields**:
- `number_of_reviews` / `number_of_reviews_ltm` / `number_of_reviews_l30d`
- `first_review` / `last_review`
- `review_scores_rating` - Overall (out of 5)
- `review_scores_accuracy`
- `review_scores_cleanliness`
- `review_scores_checkin`
- `review_scores_communication`
- `review_scores_location`
- `review_scores_value`
- `reviews_per_month`

**Location Fields**:
- `latitude` / `longitude` (WGS84)
- `neighbourhood` / `neighbourhood_cleansed` / `neighbourhood_group_cleansed`

**Additional files**: `calendar.csv` (daily price and availability), `reviews.csv` (full review text with dates)

Source: [Inside Airbnb - Get the Data](https://insideairbnb.com/get-the-data/), [Inside Airbnb Data Dictionary v4.3](https://github.com/lakshyaag/INSY662-Group-Project/blob/master/Inside%20Airbnb%20Data%20Dictionary%20-%20listings.csv%20detail%20v4.3.csv)

### 3.2 AirDNA Dataset (Commercial)

- RevPAR, ADR, occupancy rates by market
- Supply/demand metrics
- Booking pace and lead times
- Competitor pricing history
- Monthly revenue estimates

Source: [AirDNA](https://www.airdna.co/)

### 3.3 Scraped Listing Data (Custom)

What can be obtained by scraping Airbnb (using tools like Cheerio, which StayTrend already uses):

- Full listing title and description
- All photos and their order
- Complete amenity list
- Pricing calendar
- Review count and scores
- Host response metrics
- Instant book status
- Property type and room configuration
- Location coordinates

### 3.4 Kaggle / Academic Datasets

Multiple Airbnb datasets on Kaggle mirror InsideAirbnb structure. Academic datasets used in published research include NYC, San Francisco, and Barcelona datasets with similar schemas.

Source: [Kaggle - Inside Airbnb USA](https://www.kaggle.com/datasets/konradb/inside-airbnb-usa), [Kaggle - Airbnb Open Data](https://www.kaggle.com/datasets/arianazmoudeh/airbnbopendata)

---

## 4. How the Data is Processed

### 4.1 Competitor Set Creation

**Method (PriceLabs approach)**:
1. Define center point: target property coordinates
2. Find 350 similar-sized listings within dynamic radius (max 15km)
3. Filter by: property type, room type, accommodation capacity, bedroom count
4. Result: Hyper-local comp set for comparison

**Method (AirDNA approach)**:
1. Link your listing to their database
2. Auto-match comparable properties by type, size, location
3. Evaluate against: occupancy, booked rate, reservation lead time, RevPAR

### 4.2 Price Benchmarking

**Pipeline**:
```
Raw calendar data (own + competitors)
  -> Extract nightly rates by date
  -> Calculate ADR, RevPAR per competitor
  -> Compare own price to comp set median/average
  -> Flag dates where price is > X% above market
  -> Generate price adjustment recommendations
```

**Signals used**: Seasonality patterns, day-of-week effects, local events/holidays, booking pace, lead time, weather, competitor rate changes.

### 4.3 Amenity Frequency Analysis

**Pipeline**:
```
Scrape amenities JSON from all comp set listings
  -> Parse into standardized amenity list
  -> Count frequency of each amenity across comp set
  -> Rank amenities by: (a) frequency in top-performing listings, (b) overall frequency
  -> Identify: amenities you're missing that top performers have
  -> Identify: rare amenities with outsized impact (e.g., EV charger)
  -> Output: prioritized list of amenities to add
```

This is exactly what RankBreeze's Amenities Analyzer does based on 10,000+ listings.

Source: [RankBreeze Optimization](https://rankbreeze.com/airbnb-optimization/)

### 4.4 Photo Analysis

**Pipeline**:
```
Collect photos from own listing + competitor listings
  -> Compare: count, quality (resolution, brightness, composition), content
  -> Identify cover photo effectiveness (CTR driver)
  -> Analyze: room representation (living room > bedroom per research)
  -> Check: landscape vs portrait orientation
  -> Output: photo reordering suggestions + missing room types
```

Academic research (Management Science, 2022) used CNN-based image analysis (Amazon Rekognition) to tag photo content and found that **living room as background image = 35% increase in booking rate**.

Source: [Management Science Paper](https://pubsonline.informs.org/doi/10.1287/mnsc.2021.4175)

### 4.5 Keyword Extraction

**Pipeline**:
```
Collect titles + descriptions from top-ranking comp set listings
  -> Extract n-grams (unigrams, bigrams, trigrams)
  -> Calculate term frequency across top performers
  -> Cross-reference with guest search query patterns (if available)
  -> Identify high-frequency terms missing from own listing
  -> Output: keyword suggestions for title + description
```

AutoRank does this by analyzing "most-searched keywords and ranking criteria" from millions of listings. Title should be 30-50 characters max (longer titles truncated in search).

Source: [AutoRank](https://www.autorank.com/product-overview), [Semrush - Airbnb SEO](https://www.semrush.com/blog/airbnb-seo/)

### 4.6 Review Sentiment Analysis

**Pipeline**:
```
Collect all reviews for listing
  -> NLP sentiment analysis (TextBlob, VADER, or transformer model)
  -> Topic extraction using LDA (Latent Dirichlet Allocation)
  -> Top 5 effective topics: room function, activity, transportation, facility, travel
  -> Identify: most praised attributes, most complained-about issues
  -> Polarity score correlates with acceptance rate and pricing power
  -> Output: strengths to highlight in listing, issues to address
```

Academic research confirms that listings with higher polarity values (more positive sentiment) correlate with increased prices and acceptance rates. Over 90% of Airbnb reviews are positive, so negative ones carry outsized weight.

Source: [arXiv:2504.14053 - Sentiment Analysis of Airbnb Reviews](https://arxiv.org/abs/2504.14053), [ResearchGate - Deep Approaches on Airbnb Sentiment](https://www.researchgate.net/publication/361505343)

### 4.7 Occupancy Modeling

**Pipeline**:
```
Calendar data (availability_30/60/90/365 from InsideAirbnb)
  -> Estimate occupancy: (total days - available days) / total days
  -> Cross-reference with: review frequency (reviews_per_month as proxy)
  -> Model occupancy against: price, amenities, review scores, location
  -> Identify which variables have highest coefficient
  -> Output: predicted occupancy at different price points
```

InsideAirbnb uses an occupancy model based on the San Francisco model with an average length of stay of 3 nights, using review frequency as a booking proxy.

Source: [Inside Airbnb - Data Assumptions](https://insideairbnb.com/data-assumptions/)

---

## 5. How Conclusions Are Derived

### 5.1 Title Optimization Logic

```
DATA: Titles of top 50 listings in comp set (by booking rate, review count, review score)
ANALYSIS: Extract common patterns, keywords, character length, structure
INSIGHT: Top performers use format "[Property Type] + [Key Amenity/View] + [Location]"
         Optimal length: 30-50 characters (longer truncated)
         Keywords matching guest search intent rank higher
ACTION: Rewrite title incorporating high-frequency keywords from top performers,
        unique selling point, location reference, within 50 char limit
```

### 5.2 Description Rewriting Logic

```
DATA: Descriptions from top performers + own review sentiment analysis
ANALYSIS: LDA topic modeling on top performer descriptions
          Keyword frequency analysis across successful listings
          Review analysis to find most-praised attributes
INSIGHT: Top 5 description topics that drive bookings:
         room function, activity, transportation, facility, travel
         Listings with host descriptions had 8.47% higher booking average
ACTION: Restructure description to lead with strongest topics
        Incorporate positive review themes
        Use short paragraphs/bullets for: parking, check-in, local tips
        Include all relevant keywords naturally
```

### 5.3 Photo Ordering Strategy

```
DATA: Photos from own listing + comp set photos + booking conversion data
ANALYSIS: CNN-based content analysis (what rooms are shown)
          Quality scoring (resolution, brightness, contrast, composition)
          Cover photo CTR comparison
INSIGHT: Living room cover photo = 35% booking increase (Management Science study)
         Professional photos = 40% more bookings, 26% higher nightly rate (Airbnb data)
         First 5 photos determine 90% of booking decisions (Airbnb internal data)
         30+ photos = 2x booking frequency
ACTION: Set living room/main space as cover photo
        Ensure first 5 photos show: living room, kitchen, master bedroom,
        bathroom, exterior/view
        Add photos until 20+ minimum
        Replace amateur photos with professional quality
```

### 5.4 Amenity Highlighting

```
DATA: Amenity JSON arrays from all listings in comp set
ANALYSIS: Frequency count per amenity across (a) all comps, (b) top 20% performers
          Gap analysis: what top performers have that you don't
          Rarity analysis: amenities with <10% presence but high correlation with bookings
INSIGHT: Must-have amenities vary by market and property type
         Rare amenities (EV charger, hot tub, pool) provide outsized ranking boost
         Every checked amenity increases filter-match probability
ACTION: Add all applicable amenities from the "missing" list
        Prioritize rare high-impact amenities for physical addition
        Ensure every existing amenity is checked in the listing
```

### 5.5 Pricing Suggestions

```
DATA: Own pricing calendar + comp set pricing + occupancy data + event calendar
ANALYSIS: PriceLabs-style hyper-local comparison
          Calculate price percentile vs. comp set per date
          Cross-reference with local events, seasonality, day-of-week
          Model booking probability at different price points
INSIGHT: Below-market pricing improves ranking (Airbnb confirmed)
         Optimal price point: competitive but not cheapest
         Event-driven pricing (concerts, festivals) can justify +30-60% premiums
ACTION: Set base price at comp set median or slightly below
        Increase for events/peak seasons based on demand signals
        Decrease for low-demand periods to maintain occupancy
        Adjust minimum nights based on market patterns
```

---

## 6. Real Examples with Sources

### 6.1 Professional Photography Impact

> "Listings with professional photography earned 28% more bookings, could charge a 26% higher nightly rate, and increased overall earnings by 40%."

Source: [Airbnb photography study data](https://www.realestatephotographerfortmyers.com/how-professional-airbnb-photography-increases-bookings-by-40/), [Hostaway - Airbnb Photographer Guide](https://www.hostaway.com/blog/how-to-hire-an-airbnb-photographer-for-your-vacation-rental/)

### 6.2 Living Room Photo Effect

> "Featuring the living room in the background image results in a 35% increase in the booking rate, which translates into $728 more revenue during a 16-night year-end holiday period."

Source: [Management Science - What Makes a Good Image?](https://pubsonline.informs.org/doi/10.1287/mnsc.2021.4175)

### 6.3 Photo Count Effect

> "Vacation rentals containing 30+ photos book twice as frequently as those with fewer images."

Source: [Airbnb photography research](https://www.realestatephotographerfortmyers.com/how-much-can-professional-photography-boost-your-airbnb-bookings/)

### 6.4 First Five Photos

> "The first five photos in your listing determine 90% of booking decisions."

Source: [Airbnb internal data](https://www.realestatephotographerfortmyers.com/how-professional-airbnb-photography-boosts-bookings-in-bonital-springs/)

### 6.5 Instant Book Ranking Boost

> "Instant Book pushes you 15-25% higher in search results."

Source: [Triad Vacation Rentals - Algorithm 2025](https://triadvacationrentals.com/blog/airbnb-algorithm-and-how-to-rank-higher)

### 6.6 Cleanliness Review Impact

> "One bad cleanliness review can drop you 10-20 places in search results. The algorithm weights individual category scores (cleanliness, accuracy, check-in) twice as heavily as the overall rating."

Source: [Triad Vacation Rentals - Algorithm 2025](https://triadvacationrentals.com/blog/airbnb-algorithm-and-how-to-rank-higher)

### 6.7 Guest Favorites Badge

> "Guest Favorites badge is now worth 25% of your ranking - more than any other single factor."

Source: [Triad Vacation Rentals - Algorithm 2025](https://triadvacationrentals.com/blog/airbnb-algorithm-and-how-to-rank-higher)

### 6.8 Click-Through Rate Improvement via Embeddings

> "Online A/B testing of listing embeddings showed CTR increased 23%."

Source: [KDD 2018 Paper](https://dl.acm.org/doi/10.1145/3219819.3219885)

### 6.9 Price Competitiveness

> "Listings that are priced below other comparable listings in the area with similar characteristics tend to rank higher in search."

Source: [Airbnb Help Center - Article 39](https://www.airbnb.com/help/article/39)

### 6.10 Description Topics That Drive Bookings

> "The top five most effective description topics are: room function, activity, transportation, facility, and travel. Having a host description resulted in a booking average of over 8.47%."

Source: [LDA topic modeling research](https://github.com/cauchi94/airbnb-customer-sentiment)

### 6.11 Review Sentiment and Price Correlation

> "Listings with higher sentiment polarity values correlated with increased predicted prices. Sentiment polarity, rather than sheer volume of reviews, is a more critical factor for host success."

Source: [arXiv:2504.14053](https://arxiv.org/abs/2504.14053)

---

## 7. Final Output: Production Pipeline

### 7.1 Data Collection Layer

| Data Source | Fields | Method | Frequency |
|-------------|--------|--------|-----------|
| Target listing (Airbnb scrape) | Title, description, photos, amenities, price, calendar, reviews, host info | Cheerio scraper (existing) | On onboarding + weekly |
| Comp set listings (Airbnb scrape) | Same fields for 50-350 nearby similar listings | Cheerio scraper with geo + filter logic | Weekly |
| InsideAirbnb | Full listings.csv + calendar.csv + reviews.csv for target city | CSV download | Quarterly (or as updated) |
| Local events | Event name, date, type, expected attendance | Event API or scraper | Weekly |
| Own performance | Views, CTR, conversion rate, booking rate | Airbnb host API (if available) or manual input | Daily/weekly |

### 7.2 Data Processing Layer

```
STEP 1: Comp Set Creation
  Input: Target listing coordinates, property type, capacity, bedrooms
  Process: Find N nearest listings matching criteria within dynamic radius
  Output: Comp set of 50-350 listings with all fields

STEP 2: Benchmarking
  Input: Comp set data
  Process:
    - Price percentile calculation per date
    - Occupancy rate comparison
    - Review score distribution analysis
    - Amenity frequency tabulation
    - Photo count/quality comparison
  Output: Performance scorecard (where target stands vs. comps)

STEP 3: Text Analysis
  Input: Titles + descriptions from comp set + own reviews
  Process:
    - N-gram extraction from top performer titles
    - LDA topic modeling on descriptions
    - Sentiment analysis on reviews (TextBlob/VADER)
    - Keyword frequency ranking
  Output: Keyword suggestions, topic priorities, sentiment summary

STEP 4: Photo Analysis
  Input: Own photos + comp set cover photos
  Process:
    - Room type classification (CNN or manual tagging)
    - Quality scoring (resolution, brightness, composition)
    - Cover photo comparison
    - Count comparison
  Output: Photo reorder suggestions, missing room types, quality gaps

STEP 5: Amenity Gap Analysis
  Input: Own amenities + comp set amenities
  Process:
    - Frequency count across all comps
    - Frequency count across top 20% performers
    - Gap identification (what top performers have, you don't)
    - Rarity scoring (low frequency but high correlation with bookings)
  Output: Prioritized amenity addition list

STEP 6: Price Optimization
  Input: Own calendar + comp set pricing + events + seasonality
  Process:
    - Base price recommendation (comp set median adjusted)
    - Event-driven markup suggestions
    - Day-of-week patterns
    - Lead time adjustments
  Output: Recommended price per date for next 90 days
```

### 7.3 Insight Extraction Layer

From the processed data, extract these actionable insights:

1. **Title Score**: Current title vs. optimal structure. Missing keywords. Length issues.
2. **Description Score**: Topic coverage. Keyword density. Structure quality. Missing themes.
3. **Photo Score**: Count vs. target. Cover photo effectiveness. Missing room types. Quality issues.
4. **Amenity Score**: Completeness vs. top performers. Missing high-impact amenities.
5. **Price Score**: Position in comp set. Over/under-priced dates. Event alignment.
6. **Review Health**: Sentiment trend. Category-specific issues (cleanliness, accuracy). Recent review quality.
7. **Operational Score**: Response rate, instant book status, calendar availability, cancellation rate.

### 7.4 Optimization Action Layer

Each insight maps to a concrete action:

| Insight | Action | Priority |
|---------|--------|----------|
| Title missing key terms | Generate optimized title with top keywords | HIGH |
| Description lacks structure | Rewrite with top 5 topic areas + review themes | HIGH |
| Cover photo not living room | Suggest reorder: living room first | HIGH |
| < 20 photos | Flag for photo shoot | HIGH |
| Missing popular amenities | List specific amenities to add/check | MEDIUM |
| Price above comp median | Suggest adjusted pricing per date | HIGH |
| Low review scores in cleanliness | Flag for operational improvement | MEDIUM |
| Instant Book disabled | Recommend enabling | MEDIUM |
| Response time > 1 hour avg | Alert host | LOW |
| Calendar blocked for next 30 days | Recommend opening availability | LOW |

### 7.5 Implementation Architecture for StayTrend

```
[Onboarding] -> Scrape target listing -> Store in Firestore (properties collection)
     |
     v
[Comp Set Builder] -> Scrape nearby listings -> Store comp set
     |
     v
[Analysis Pipeline] (can run as cron job)
  |-- Price Benchmarker -> pricing subcollection
  |-- Amenity Analyzer -> content subcollection
  |-- Text Analyzer (NLP) -> content subcollection
  |-- Photo Analyzer -> assets subcollection
  |-- Review Analyzer -> analytics subcollection
     |
     v
[Recommendation Engine]
  |-- Title suggestions
  |-- Description rewrite
  |-- Photo reorder suggestions
  |-- Amenity checklist
  |-- Price calendar adjustments
     |
     v
[Portal Display] -> /portal/plan (strategy)
                 -> /portal/pricing (price calendar)
                 -> /portal/content (listing optimization)
                 -> /portal/analytics (performance tracking)
```

---

## Sources

### Airbnb Official
- [Airbnb Help Center - How search results work](https://www.airbnb.com/help/article/39)
- [Airbnb Global Quality Report](https://news.airbnb.com/airbnb-global-quality-report/)

### Airbnb Engineering (Academic/Technical)
- [KDD 2018 - Real-time Personalization using Embeddings](https://dl.acm.org/doi/10.1145/3219819.3219885)
- [Listing Embeddings in Search Ranking - Airbnb Tech Blog](https://medium.com/airbnb-engineering/listing-embeddings-for-similar-listing-recommendations-and-real-time-personalization-in-search-601172f7603e)
- [Applying Deep Learning To Airbnb Search - KDD 2019](https://arxiv.org/abs/1810.09591)
- [Learning To Rank Diversely - Airbnb Tech Blog](https://medium.com/airbnb-engineering/learning-to-rank-diversely-add6b1929621)
- [Machine Learning-Powered Search Ranking of Experiences](https://medium.com/airbnb-engineering/machine-learning-powered-search-ranking-of-airbnb-experiences-110b4b1a0789)

### Academic Papers
- [What Makes a Good Image? - Management Science 2022](https://pubsonline.informs.org/doi/10.1287/mnsc.2021.4175)
- [Image features and demand in the sharing economy - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0167811623000174)
- [Sentiment Analysis of Airbnb Reviews - arXiv 2025](https://arxiv.org/abs/2504.14053)
- [Sustainable Price Prediction with Sentiment Analysis - MDPI](https://www.mdpi.com/2071-1050/15/17/13159)

### Commercial Services
- [RankBreeze](https://rankbreeze.com/)
- [AutoRank](https://www.autorank.com)
- [AirDNA](https://www.airdna.co/)
- [PriceLabs](https://hello.pricelabs.co/)
- [Hostaway - Airbnb Algorithm](https://www.hostaway.com/blog/airbnb-search-algorithm/)
- [Lodgify - Airbnb SEO](https://www.lodgify.com/blog/airbnb-search-results/)

### Data Sources
- [Inside Airbnb - Get the Data](https://insideairbnb.com/get-the-data/)
- [Inside Airbnb Data Dictionary v4.3](https://github.com/lakshyaag/INSY662-Group-Project/blob/master/Inside%20Airbnb%20Data%20Dictionary%20-%20listings.csv%20detail%20v4.3.csv)
- [Inside Airbnb - Data Assumptions](https://insideairbnb.com/data-assumptions/)

### Industry Analysis
- [Airbnb Smart - 15 Ranking Metrics](https://airbnbsmart.com/airbnb-ranking-strategy/)
- [Triad Vacation Rentals - Algorithm 2025](https://triadvacationrentals.com/blog/airbnb-algorithm-and-how-to-rank-higher)
- [Homesberg - 2025 Algorithm Update](https://www.homesberg.com/en/airbnb-algorithm-2025-update-what-to-know/)
- [Rental Scale-Up - Booking Probability Drives Visibility](https://www.rentalscaleup.com/how-to-rank-higher-on-airbnb-booking-probability-and-guest-satisfaction-now-drive-visibility/)
- [Semrush - Airbnb SEO](https://www.semrush.com/blog/airbnb-seo/)
- [HigherBookings - Airbnb SEO](https://higherbookings.com/airbnb-seo/)
