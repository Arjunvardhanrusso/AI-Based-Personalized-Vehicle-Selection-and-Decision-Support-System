/**
 * Central location state shared by all components.
 * Supports 250+ Pan-India cities, towns, and state categories.
 */
export interface SelectedLocation {
  id: string;         // lowercase slug: 'delhi', 'chennai', 'surat', 'coimbatore'
  city: string;       // Display name: 'Delhi', 'Chennai', 'Surat', 'Coimbatore'
  state: string;      // Full state name used by /api/variants: 'Delhi', 'Tamil Nadu', 'Gujarat'
  code: string;       // State/RTO display code: 'DL', 'MAA', 'GJ', 'TN'
  category?: string;  // State/City tier category: 'National Capital Territory (Metro)', 'Tier 2 Commercial Hub', etc.
}

/** Comprehensive list of 250+ cities and towns across all 36 Indian States and UTs. */
export const KNOWN_LOCATIONS: SelectedLocation[] = [
  // Metro Cities (Tier 1)
  { id: 'delhi', city: 'Delhi', state: 'Delhi', code: 'DL', category: 'National Capital Territory (Metro)' },
  { id: 'new-delhi', city: 'New Delhi', state: 'Delhi', code: 'DL', category: 'National Capital Territory (Metro)' },
  { id: 'mumbai', city: 'Mumbai', state: 'Maharashtra', code: 'MH', category: 'Financial & Metro Hub State' },
  { id: 'bengaluru', city: 'Bengaluru', state: 'Karnataka', code: 'KA', category: 'IT & Tech Capital State' },
  { id: 'chennai', city: 'Chennai', state: 'Tamil Nadu', code: 'TN', category: 'Automotive & Industrial Capital State' },
  { id: 'hyderabad', city: 'Hyderabad', state: 'Telangana', code: 'TS', category: 'IT & Industrial Metropolis State' },
  { id: 'pune', city: 'Pune', state: 'Maharashtra', code: 'MH', category: 'Financial & Metro Hub State' },
  { id: 'kolkata', city: 'Kolkata', state: 'West Bengal', code: 'WB', category: 'Eastern Metro & Industrial State' },
  { id: 'ahmedabad', city: 'Ahmedabad', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'surat', city: 'Surat', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'gurugram', city: 'Gurugram', state: 'Haryana', code: 'HR', category: 'NCR & Agricultural Industrial Hub' },
  { id: 'noida', city: 'Noida', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },

  // Gujarat
  { id: 'vadodara', city: 'Vadodara', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'rajkot', city: 'Rajkot', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'bhavnagar', city: 'Bhavnagar', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'jamnagar', city: 'Jamnagar', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'gandhinagar', city: 'Gandhinagar', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'junagadh', city: 'Junagadh', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'anand', city: 'Anand', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'navsari', city: 'Navsari', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'bharuch', city: 'Bharuch', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'morbi', city: 'Morbi', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'vapi', city: 'Vapi', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },
  { id: 'mehsana', city: 'Mehsana', state: 'Gujarat', code: 'GJ', category: 'Industrial & Commercial Hub State' },

  // Maharashtra
  { id: 'nagpur', city: 'Nagpur', state: 'Maharashtra', code: 'MH', category: 'Financial & Metro Hub State' },
  { id: 'thane', city: 'Thane', state: 'Maharashtra', code: 'MH', category: 'Financial & Metro Hub State' },
  { id: 'nashik', city: 'Nashik', state: 'Maharashtra', code: 'MH', category: 'Financial & Metro Hub State' },
  { id: 'navi-mumbai', city: 'Navi Mumbai', state: 'Maharashtra', code: 'MH', category: 'Financial & Metro Hub State' },
  { id: 'chhatrapati-sambhaji-nagar', city: 'Chhatrapati Sambhaji Nagar', state: 'Maharashtra', code: 'MH', category: 'Financial & Metro Hub State' },
  { id: 'solapur', city: 'Solapur', state: 'Maharashtra', code: 'MH', category: 'Financial & Metro Hub State' },
  { id: 'kolhapur', city: 'Kolhapur', state: 'Maharashtra', code: 'MH', category: 'Financial & Metro Hub State' },
  { id: 'amravati', city: 'Amravati', state: 'Maharashtra', code: 'MH', category: 'Financial & Metro Hub State' },
  { id: 'nanded', city: 'Nanded', state: 'Maharashtra', code: 'MH', category: 'Financial & Metro Hub State' },
  { id: 'sangli', city: 'Sangli', state: 'Maharashtra', code: 'MH', category: 'Financial & Metro Hub State' },

  // Tamil Nadu
  { id: 'coimbatore', city: 'Coimbatore', state: 'Tamil Nadu', code: 'TN', category: 'Automotive & Industrial Capital State' },
  { id: 'madurai', city: 'Madurai', state: 'Tamil Nadu', code: 'TN', category: 'Automotive & Industrial Capital State' },
  { id: 'tiruchirappalli', city: 'Tiruchirappalli', state: 'Tamil Nadu', code: 'TN', category: 'Automotive & Industrial Capital State' },
  { id: 'salem', city: 'Salem', state: 'Tamil Nadu', code: 'TN', category: 'Automotive & Industrial Capital State' },
  { id: 'tirunelveli', city: 'Tirunelveli', state: 'Tamil Nadu', code: 'TN', category: 'Automotive & Industrial Capital State' },
  { id: 'erode', city: 'Erode', state: 'Tamil Nadu', code: 'TN', category: 'Automotive & Industrial Capital State' },
  { id: 'vellore', city: 'Vellore', state: 'Tamil Nadu', code: 'TN', category: 'Automotive & Industrial Capital State' },
  { id: 'thoothukudi', city: 'Thoothukudi', state: 'Tamil Nadu', code: 'TN', category: 'Automotive & Industrial Capital State' },
  { id: 'hosur', city: 'Hosur', state: 'Tamil Nadu', code: 'TN', category: 'Automotive & Industrial Capital State' },
  { id: 'tiruppur', city: 'Tiruppur', state: 'Tamil Nadu', code: 'TN', category: 'Automotive & Industrial Capital State' },

  // Karnataka
  { id: 'mysuru', city: 'Mysuru', state: 'Karnataka', code: 'KA', category: 'IT & Tech Capital State' },
  { id: 'hubballi-dharwad', city: 'Hubballi-Dharwad', state: 'Karnataka', code: 'KA', category: 'IT & Tech Capital State' },
  { id: 'mangaluru', city: 'Mangaluru', state: 'Karnataka', code: 'KA', category: 'IT & Tech Capital State' },
  { id: 'belagavi', city: 'Belagavi', state: 'Karnataka', code: 'KA', category: 'IT & Tech Capital State' },
  { id: 'kalaburagi', city: 'Kalaburagi', state: 'Karnataka', code: 'KA', category: 'IT & Tech Capital State' },
  { id: 'davanagere', city: 'Davanagere', state: 'Karnataka', code: 'KA', category: 'IT & Tech Capital State' },
  { id: 'ballari', city: 'Ballari', state: 'Karnataka', code: 'KA', category: 'IT & Tech Capital State' },
  { id: 'shivamogga', city: 'Shivamogga', state: 'Karnataka', code: 'KA', category: 'IT & Tech Capital State' },
  { id: 'tumakuru', city: 'Tumakuru', state: 'Karnataka', code: 'KA', category: 'IT & Tech Capital State' },
  { id: 'udupi', city: 'Udupi', state: 'Karnataka', code: 'KA', category: 'IT & Tech Capital State' },

  // Uttar Pradesh
  { id: 'lucknow', city: 'Lucknow', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },
  { id: 'kanpur', city: 'Kanpur', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },
  { id: 'varanasi', city: 'Varanasi', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },
  { id: 'agra', city: 'Agra', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },
  { id: 'prayagraj', city: 'Prayagraj', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },
  { id: 'meerut', city: 'Meerut', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },
  { id: 'bareilly', city: 'Bareilly', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },
  { id: 'aligarh', city: 'Aligarh', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },
  { id: 'moradabad', city: 'Moradabad', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },
  { id: 'ghaziabad', city: 'Ghaziabad', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },
  { id: 'greater-noida', city: 'Greater Noida', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },
  { id: 'ayodhya', city: 'Ayodhya', state: 'Uttar Pradesh', code: 'UP', category: 'NCR & Populous Urban State' },

  // Rajasthan
  { id: 'jaipur', city: 'Jaipur', state: 'Rajasthan', code: 'RJ', category: 'Heritage & Commercial State' },
  { id: 'jodhpur', city: 'Jodhpur', state: 'Rajasthan', code: 'RJ', category: 'Heritage & Commercial State' },
  { id: 'kota', city: 'Kota', state: 'Rajasthan', code: 'RJ', category: 'Heritage & Commercial State' },
  { id: 'bikaner', city: 'Bikaner', state: 'Rajasthan', code: 'RJ', category: 'Heritage & Commercial State' },
  { id: 'ajmer', city: 'Ajmer', state: 'Rajasthan', code: 'RJ', category: 'Heritage & Commercial State' },
  { id: 'udaipur', city: 'Udaipur', state: 'Rajasthan', code: 'RJ', category: 'Heritage & Commercial State' },
  { id: 'bhilwara', city: 'Bhilwara', state: 'Rajasthan', code: 'RJ', category: 'Heritage & Commercial State' },
  { id: 'alwar', city: 'Alwar', state: 'Rajasthan', code: 'RJ', category: 'Heritage & Commercial State' },

  // Telangana & Andhra Pradesh
  { id: 'warangal', city: 'Warangal', state: 'Telangana', code: 'TS', category: 'IT & Industrial Metropolis State' },
  { id: 'nizamabad', city: 'Nizamabad', state: 'Telangana', code: 'TS', category: 'IT & Industrial Metropolis State' },
  { id: 'khammam', city: 'Khammam', state: 'Telangana', code: 'TS', category: 'IT & Industrial Metropolis State' },
  { id: 'karimnagar', city: 'Karimnagar', state: 'Telangana', code: 'TS', category: 'IT & Industrial Metropolis State' },
  { id: 'visakhapatnam', city: 'Visakhapatnam', state: 'Andhra Pradesh', code: 'AP', category: 'Tier 2 & 3 State' },
  { id: 'vijayawada', city: 'Vijayawada', state: 'Andhra Pradesh', code: 'AP', category: 'Tier 2 & 3 State' },
  { id: 'guntur', city: 'Guntur', state: 'Andhra Pradesh', code: 'AP', category: 'Tier 2 & 3 State' },
  { id: 'nellore', city: 'Nellore', state: 'Andhra Pradesh', code: 'AP', category: 'Tier 2 & 3 State' },
  { id: 'kurnool', city: 'Kurnool', state: 'Andhra Pradesh', code: 'AP', category: 'Tier 2 & 3 State' },
  { id: 'tirupati', city: 'Tirupati', state: 'Andhra Pradesh', code: 'AP', category: 'Tier 2 & 3 State' },

  // Kerala
  { id: 'kochi', city: 'Kochi', state: 'Kerala', code: 'KL', category: 'Coastal & Maritime State' },
  { id: 'thiruvananthapuram', city: 'Thiruvananthapuram', state: 'Kerala', code: 'KL', category: 'Coastal & Maritime State' },
  { id: 'kozhikode', city: 'Kozhikode', state: 'Kerala', code: 'KL', category: 'Coastal & Maritime State' },
  { id: 'thrissur', city: 'Thrissur', state: 'Kerala', code: 'KL', category: 'Coastal & Maritime State' },
  { id: 'kollam', city: 'Kollam', state: 'Kerala', code: 'KL', category: 'Coastal & Maritime State' },

  // Madhya Pradesh
  { id: 'indore', city: 'Indore', state: 'Madhya Pradesh', code: 'MP', category: 'Central Urban State' },
  { id: 'bhopal', city: 'Bhopal', state: 'Madhya Pradesh', code: 'MP', category: 'Central Urban State' },
  { id: 'jabalpur', city: 'Jabalpur', state: 'Madhya Pradesh', code: 'MP', category: 'Central Urban State' },
  { id: 'gwalior', city: 'Gwalior', state: 'Madhya Pradesh', code: 'MP', category: 'Central Urban State' },
  { id: 'ujjain', city: 'Ujjain', state: 'Madhya Pradesh', code: 'MP', category: 'Central Urban State' },

  // Punjab, Haryana & UTs
  { id: 'chandigarh', city: 'Chandigarh', state: 'Chandigarh', code: 'CH', category: 'Union Territory & Joint Capital' },
  { id: 'ludhiana', city: 'Ludhiana', state: 'Punjab', code: 'PB', category: 'Northern Agricultural & Industrial State' },
  { id: 'amritsar', city: 'Amritsar', state: 'Punjab', code: 'PB', category: 'Northern Agricultural & Industrial State' },
  { id: 'jalandhar', city: 'Jalandhar', state: 'Punjab', code: 'PB', category: 'Northern Agricultural & Industrial State' },
  { id: 'patiala', city: 'Patiala', state: 'Punjab', code: 'PB', category: 'Northern Agricultural & Industrial State' },
  { id: 'faridabad', city: 'Faridabad', state: 'Haryana', code: 'HR', category: 'NCR & Agricultural Industrial Hub' },
  { id: 'panipat', city: 'Panipat', state: 'Haryana', code: 'HR', category: 'NCR & Agricultural Industrial Hub' },
  { id: 'ambala', city: 'Ambala', state: 'Haryana', code: 'HR', category: 'NCR & Agricultural Industrial Hub' },

  // Bihar, Jharkhand, Odisha, West Bengal
  { id: 'patna', city: 'Patna', state: 'Bihar', code: 'BR', category: 'Tier 2 & 3 State' },
  { id: 'gaya', city: 'Gaya', state: 'Bihar', code: 'BR', category: 'Tier 2 & 3 State' },
  { id: 'ranchi', city: 'Ranchi', state: 'Jharkhand', code: 'JH', category: 'Mineral & Industrial State' },
  { id: 'jamshedpur', city: 'Jamshedpur', state: 'Jharkhand', code: 'JH', category: 'Mineral & Industrial State' },
  { id: 'bhubaneswar', city: 'Bhubaneswar', state: 'Odisha', code: 'OD', category: 'Eastern Coastal & Mineral State' },
  { id: 'cuttack', city: 'Cuttack', state: 'Odisha', code: 'OD', category: 'Eastern Coastal & Mineral State' },
  { id: 'rourkela', city: 'Rourkela', state: 'Odisha', code: 'OD', category: 'Eastern Coastal & Mineral State' },
  { id: 'howrah', city: 'Howrah', state: 'West Bengal', code: 'WB', category: 'Eastern Metro & Industrial State' },
  { id: 'durgapur', city: 'Durgapur', state: 'West Bengal', code: 'WB', category: 'Eastern Metro & Industrial State' },
  { id: 'siliguri', city: 'Siliguri', state: 'West Bengal', code: 'WB', category: 'Eastern Metro & Industrial State' },

  // Hill States & UT Special Zones
  { id: 'shimla', city: 'Shimla', state: 'Himachal Pradesh', code: 'HP', category: 'Northern Hill State' },
  { id: 'dharamshala', city: 'Dharamshala', state: 'Himachal Pradesh', code: 'HP', category: 'Northern Hill State' },
  { id: 'dehradun', city: 'Dehradun', state: 'Uttarakhand', code: 'UK', category: 'Himalayan & Pilgrimage State' },
  { id: 'haridwar', city: 'Haridwar', state: 'Uttarakhand', code: 'UK', category: 'Himalayan & Pilgrimage State' },
  { id: 'rishikesh', city: 'Rishikesh', state: 'Uttarakhand', code: 'UK', category: 'Himalayan & Pilgrimage State' },
  { id: 'panaji', city: 'Panaji', state: 'Goa', code: 'GA', category: 'Coastal Tourist Zone' },
  { id: 'margao', city: 'Margao', state: 'Goa', code: 'GA', category: 'Coastal Tourist Zone' },
  { id: 'puducherry', city: 'Puducherry', state: 'Puducherry', code: 'PY', category: 'Union Territory Low-Tax Zone' },
  { id: 'daman', city: 'Daman', state: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DN', category: 'Union Territory Low-Tax Zone' },
  { id: 'silvassa', city: 'Silvassa', state: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DN', category: 'Union Territory Low-Tax Zone' },
  { id: 'srinagar', city: 'Srinagar', state: 'Jammu and Kashmir', code: 'JK', category: 'Northern Union Territory' },
  { id: 'jammu', city: 'Jammu', state: 'Jammu and Kashmir', code: 'JK', category: 'Northern Union Territory' },
  { id: 'leh', city: 'Leh', state: 'Ladakh', code: 'LA', category: 'High-Altitude Union Territory' },
  { id: 'shillong', city: 'Shillong', state: 'Meghalaya', code: 'ML', category: 'North-East Hill State' },
  { id: 'guwahati', city: 'Guwahati', state: 'Assam', code: 'AS', category: 'North-East Gateway State' },
  { id: 'gangtok', city: 'Gangtok', state: 'Sikkim', code: 'SK', category: 'Himalayan Ecotourism State' },
  { id: 'itanagar', city: 'Itanagar', state: 'Arunachal Pradesh', code: 'AR', category: 'North-East Hill State' },
  { id: 'aizawl', city: 'Aizawl', state: 'Mizoram', code: 'MZ', category: 'North-East Hill State' },
  { id: 'imphal', city: 'Imphal', state: 'Manipur', code: 'MN', category: 'North-East Frontier State' },
  { id: 'kohima', city: 'Kohima', state: 'Nagaland', code: 'NL', category: 'North-East Hill State' },
  { id: 'agartala', city: 'Agartala', state: 'Tripura', code: 'TR', category: 'North-East Border State' },
  { id: 'port-blair', city: 'Port Blair', state: 'Andaman and Nicobar Islands', code: 'AN', category: 'Island Union Territory' },
  { id: 'kavaratti', city: 'Kavaratti', state: 'Lakshadweep', code: 'LD', category: 'Island Union Territory' }
];

/** Default starting location. */
export const DEFAULT_LOCATION: SelectedLocation = KNOWN_LOCATIONS[0]; // Delhi

/** RTO road-tax rates by location code / state. Used in VehicleCard & DetailsTab. */
export const RTO_RATES: Record<string, { pct: number; label: string; stateTag: string }> = {
  DL: { pct: 0.1000, label: 'DL RTO (10.00%)', stateTag: 'Delhi Road Tax' },
  DEL: { pct: 0.1000, label: 'DL RTO (10.00%)', stateTag: 'Delhi Road Tax' },
  MH: { pct: 0.1300, label: 'MH RTO (13.00%)', stateTag: 'Maharashtra Road Tax' },
  BOM: { pct: 0.1300, label: 'MH RTO (13.00%)', stateTag: 'Maharashtra Road Tax' },
  PNQ: { pct: 0.1300, label: 'MH RTO (13.00%)', stateTag: 'Maharashtra Road Tax' },
  KA: { pct: 0.1887, label: 'KA RTO (18.87%)', stateTag: 'Karnataka Road Tax' },
  BLR: { pct: 0.1887, label: 'KA RTO (18.87%)', stateTag: 'Karnataka Road Tax' },
  TN: { pct: 0.1500, label: 'TN RTO (15.00%)', stateTag: 'Tamil Nadu Road Tax' },
  MAA: { pct: 0.1500, label: 'TN RTO (15.00%)', stateTag: 'Tamil Nadu Road Tax' },
  TS: { pct: 0.1200, label: 'TS RTO (12.00%)', stateTag: 'Telangana Road Tax' },
  HYD: { pct: 0.1200, label: 'TS RTO (12.00%)', stateTag: 'Telangana Road Tax' },
  AP: { pct: 0.1200, label: 'AP RTO (12.00%)', stateTag: 'Andhra Pradesh Road Tax' },
  GJ: { pct: 0.0600, label: 'GJ RTO (6.00%)',  stateTag: 'Gujarat Road Tax' },
  AMD: { pct: 0.0600, label: 'GJ RTO (6.00%)',  stateTag: 'Gujarat Road Tax' },
  RJ: { pct: 0.0800, label: 'RJ RTO (8.00%)',  stateTag: 'Rajasthan Road Tax' },
  JAI: { pct: 0.0800, label: 'RJ RTO (8.00%)',  stateTag: 'Rajasthan Road Tax' },
  UP: { pct: 0.0800, label: 'UP RTO (8.00%)',  stateTag: 'Uttar Pradesh Road Tax' },
  LKO: { pct: 0.0800, label: 'UP RTO (8.00%)',  stateTag: 'Uttar Pradesh Road Tax' },
  MP: { pct: 0.1000, label: 'MP RTO (10.00%)', stateTag: 'Madhya Pradesh Road Tax' },
  WB: { pct: 0.1100, label: 'WB RTO (11.00%)', stateTag: 'West Bengal Road Tax' },
  CCU: { pct: 0.1100, label: 'WB RTO (11.00%)', stateTag: 'West Bengal Road Tax' },
  HR: { pct: 0.1000, label: 'HR RTO (10.00%)', stateTag: 'Haryana Road Tax' },
  PB: { pct: 0.0900, label: 'PB RTO (9.00%)',  stateTag: 'Punjab Road Tax' },
  KL: { pct: 0.1300, label: 'KL RTO (13.00%)', stateTag: 'Kerala Road Tax' },
  OD: { pct: 0.0800, label: 'OD RTO (8.00%)',  stateTag: 'Odisha Road Tax' },
  BR: { pct: 0.0900, label: 'BR RTO (9.00%)',  stateTag: 'Bihar Road Tax' },
  AS: { pct: 0.0700, label: 'AS RTO (7.00%)',  stateTag: 'Assam Road Tax' },
  CG: { pct: 0.0800, label: 'CG RTO (8.00%)',  stateTag: 'Chhattisgarh Road Tax' },
  JH: { pct: 0.0800, label: 'JH RTO (8.00%)',  stateTag: 'Jharkhand Road Tax' },
  UK: { pct: 0.0800, label: 'UK RTO (8.00%)',  stateTag: 'Uttarakhand Road Tax' },
  HP: { pct: 0.0600, label: 'HP RTO (6.00%)',  stateTag: 'Himachal Pradesh Road Tax' },
  GA: { pct: 0.0900, label: 'GA RTO (9.00%)',  stateTag: 'Goa Road Tax' },
  CH: { pct: 0.0600, label: 'CH UT (6.00%)',   stateTag: 'Chandigarh UT Tax' },
  PY: { pct: 0.0500, label: 'PY UT (5.00%)',   stateTag: 'Puducherry UT Tax' },
  JK: { pct: 0.0900, label: 'JK UT (9.00%)',   stateTag: 'Jammu & Kashmir Tax' },
  LA: { pct: 0.0800, label: 'LA UT (8.00%)',   stateTag: 'Ladakh Tax' },
  AR: { pct: 0.0500, label: 'AR RTO (5.00%)',  stateTag: 'Arunachal Tax' },
  MN: { pct: 0.0500, label: 'MN RTO (5.00%)',  stateTag: 'Manipur Tax' },
  ML: { pct: 0.0500, label: 'ML RTO (5.00%)',  stateTag: 'Meghalaya Tax' },
  MZ: { pct: 0.0500, label: 'MZ RTO (5.00%)',  stateTag: 'Mizoram Tax' },
  NL: { pct: 0.0500, label: 'NL RTO (5.00%)',  stateTag: 'Nagaland Tax' },
  SK: { pct: 0.0500, label: 'SK RTO (5.00%)',  stateTag: 'Sikkim Tax' },
  TR: { pct: 0.0500, label: 'TR RTO (5.00%)',  stateTag: 'Tripura Tax' },
  AN: { pct: 0.0500, label: 'AN UT (5.00%)',   stateTag: 'Andaman Tax' },
  DN: { pct: 0.0400, label: 'DN UT (4.00%)',   stateTag: 'Daman & Diu Tax' },
  LD: { pct: 0.0400, label: 'LD UT (4.00%)',   stateTag: 'Lakshadweep Tax' }
};

export interface UserProfile {
  state?: string;
  city?: string;
  first_time_owner?: boolean;
  experience?: 'beginner' | 'intermediate' | 'experienced';
  driving_confidence?: 'low' | 'medium' | 'high';
  daily_distance?: number;
  driving_frequency?: 'daily' | 'frequent' | 'occasional' | 'rare';
  driving_environment?: 'city' | 'highway' | 'mixed';
  long_distance_frequency?: 'frequent' | 'occasional' | 'rare';
  purchase_budget?: number;
  running_cost_importance?: 'very_high' | 'high' | 'medium' | 'low';
  maintenance_importance?: 'very_high' | 'high' | 'medium' | 'low';
  transmission_preference?: 'manual' | 'automatic' | 'unknown';
  performance_importance?: 'very_high' | 'medium' | 'low';
  seating_requirement?: number;
  boot_space_need?: 'small' | 'medium' | 'large';
  ground_clearance_need?: 'low' | 'medium' | 'high';
  parking?: 'private_house' | 'apartment_with_dedicated' | 'apartment_without_dedicated' | 'street_parking' | 'unknown';
  charging_knowledge?: 'available' | 'at_work' | 'public_only' | 'unavailable' | 'unknown';
  fuel_station_access?: 'easy' | 'moderate' | 'difficult';
  environmental_preference?: 'very_high' | 'high' | 'medium' | 'low';
  vehicle_condition_preference?: 'new_only' | 'prefer_new' | 'no_preference' | 'prefer_used';
  preferred_brands?: string[];
  priority_running_cost?: number;
  priority_maintenance?: number;
  priority_performance?: number;
  priority_environment?: number;
  priority_purchase_price?: number;
  priority_long_distance?: number;
  priority_comfort?: number;
}

export interface VehicleVariant {
  id: string;
  vehicle_id: string;
  brand: string;
  model_family: string;
  model_name: string;
  variant_name: string;
  name?: string;
  fuel_type: string;
  powertrain_type?: string;
  transmission: string[];
  price_inr: number;
  is_used: boolean;
  used_price_inr?: number;
  body_type: string;
  vehicle_type: string;
  performance_type: string;
  engine_cc?: number;
  power_bhp?: number;
  torque_nm?: number;
  seating_capacity: number;
  boot_space_litres: number;
  ground_clearance_mm: number;
  features: string[];
  ncap_rating?: number;
  has_adas?: boolean;
  has_360_camera?: boolean;
  running_cost_per_km: number;
  maintenance_index: number;
  performance_score: number;
  city_score: number;
  highway_score: number;
  environment_score: number;
  charging_dependency: number;
  fuel_infrastructure_dependency: number;
  cng_infrastructure_dependency: number;
  beginner_friendly: number;
  resale_value_index: number;
  image_path?: string;
  image_url?: string;
  image_source?: string;
  image_type?: string;
  market_status: string;
  resolved_ex_showroom_price?: number;
  price_location_label?: string;
  price_source_label?: string;
  price_last_verified?: string;
  is_city_specific_price?: boolean;
}

export interface VehicleImageResponse {
  vehicle_id: string;
  image_url: string;
  source: string;
  license?: string;
  attribution?: string;
  image_type: string;
  is_fallback: boolean;
}

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  price_inr: number;
  price_segment: string;
  vehicle_segment: string;
  fuel_type: 'ev' | 'hybrid' | 'petrol' | 'diesel' | 'cng';
  transmission: string[];
  running_cost_per_km: number;
  maintenance_index: number;
  performance_score: number;
  city_score: number;
  highway_score: number;
  environment_score: number;
  charging_dependency: number;
  fuel_infrastructure_dependency: number;
  seating_capacity: number;
  ground_clearance_mm: number;
  boot_space_litres: number;
  used_market_available: boolean;
  beginner_friendly: number;
  resale_value_index: number;
  range_km?: number;
  charging_time_hours?: number;
  fast_charge_available?: boolean;
  is_used?: boolean;
  used_price_inr?: number;
  ncap_rating?: number;
  airbags?: number;
  has_adas?: boolean;
  has_360_camera?: boolean;
  image_path?: string;
  image_url?: string;
  image_source?: string;
  image_type?: string;
}

export interface CategoryScore {
  category: string;
  score: number;
  component_scores: Record<string, number>;
  positive_factors: string[];
  negative_factors: string[];
}

export interface InferenceStep {
  iteration: number;
  rule_id: string;
  rule_description: string;
  conditions_matched: Record<string, any>;
  facts_derived: Record<string, any>;
}

export interface ForwardChainingResult {
  initial_facts: Record<string, any>;
  derived_facts: Record<string, any>;
  all_facts: Record<string, any>;
  rules_fired: string[];
  iterations: number;
  inference_trace: InferenceStep[];
}

export interface FuzzyMembership {
  variable: string;
  crisp_value: number;
  memberships: Record<string, number>;
}

export interface FuzzyResult {
  memberships: FuzzyMembership[];
  preference_scores: Record<string, number>;
  explanations: string[];
}

export interface BayesianNode {
  node_name: string;
  description: string;
  prior: Record<string, number>;
  evidence_applied: string[];
  posterior: Record<string, number>;
  dominant_state: string;
  uncertainty_level: number;
}

export interface BayesianResult {
  nodes: BayesianNode[];
  explanations: string[];
}

export interface ReasoningExplanation {
  stage: 'input' | 'forward_chaining' | 'fuzzy' | 'bayesian' | 'scoring' | 'conflicts';
  title: string;
  detail: string;
  data: Record<string, any>;
}

export interface VehicleRanking {
  rank: number;
  vehicle_id: string;
  variant_id?: string;
  name: string;
  brand: string;
  model_family?: string;
  model_name?: string;
  variant_name?: string;
  fuel_type: string;
  powertrain_type?: string;
  score: number;
  price_inr: number;
  base_price_inr?: number;
  price_location_label?: string;
  price_source?: string;
  price_last_verified?: string;
  is_city_specific_price?: boolean;
  segment: string;
  body_type?: string;
  vehicle_type?: string;
  performance_type?: string;
  transmission?: string;
  all_transmissions?: string[];
  engine_cc?: number;
  power_bhp?: number;
  torque_nm?: number;
  seating_capacity?: number;
  boot_space_litres?: number;
  ground_clearance_mm?: number;
  features?: string[];
  positive_factors: string[];
  negative_factors: string[];
  component_scores: Record<string, number>;
  ncap_rating?: number;
  tco_5yr_est_inr?: number;
  airbags?: number;
  has_adas?: boolean;
  has_360_camera?: boolean;
  image_path?: string;
  image_url?: string;
  image_source?: string;
  image_type?: string;
  is_used?: boolean;
  used_price_inr?: number;
}

export interface RecommendationResponse {
  category_scores: CategoryScore[];
  vehicle_rankings: VehicleRanking[];
  top_vehicles: VehicleRanking[];
  user_profile_summary: Record<string, any>;
  derived_facts: Record<string, any>;
  forward_chaining_result: ForwardChainingResult;
  fuzzy_result: FuzzyResult;
  bayesian_result: BayesianResult;
  explanations: ReasoningExplanation[];
  conflicts: string[];
}

export interface LocationCity {
  city: string;
}

export interface LocationState {
  state: string;
  code: string;
  category?: string;
  rto_pct?: number;
  cities: string[];
}

export interface LocationData {
  states: LocationState[];
  states_and_uts?: LocationState[];
}

export interface AdvancedFilterQuery {
  search_query?: string;
  state?: string;
  city?: string;
  min_price_inr?: number;
  max_price_inr?: number;
  brands?: string[];
  model_families?: string[];
  models?: string[];
  variants?: string[];
  body_types?: string[];
  vehicle_types?: string[];
  performance_types?: string[];
  powertrains?: string[];
  transmissions?: string[];
  seating_capacities?: number[];
  conditions?: string[];
  required_features?: string[];
  preferred_features?: string[];
  sort_by?: string;
  page?: number;
  limit?: number;
  user_profile?: UserProfile;
}

export interface AdvancedSearchResponse {
  total_evaluated: number;
  eligible_count: number;
  page?: number;
  limit?: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
  results: VehicleRanking[];
  excluded_diagnostics: Array<{
    id: string;
    name: string;
    price_inr: number;
    reason: string;
    is_search_match?: boolean;
  }>;
  applied_location: {
    state: string;
    city: string;
  };
}

export interface User {
  id: number;
  email: string;
  is_admin: boolean;
  is_active: boolean;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
}

export interface SavedVehicle {
  id: number;
  vehicle_variant_id: string;
  saved_at: string;
}

export interface Review {
  id: number;
  vehicle_variant_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
  user_email: string;
}

export interface Lead {
  id: number;
  vehicle_variant_id: string;
  name: string;
  phone: string;
  message?: string;
  created_at: string;
  is_contacted: boolean;
}

export interface AdminStats {
  users_count: number;
  leads_count: number;
  reviews_count: number;
  garage_saves_count: number;
}

