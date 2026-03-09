export const AFRICAN_COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'Tanzania',
  'Uganda',
  'Ethiopia',
  'Rwanda',
  'Cameroon',
  'Senegal',
  'Ivory Coast',
  'Egypt',
  'Morocco',
  'Algeria',
  'Tunisia',
  'Angola',
  'Mozambique',
  'Zimbabwe',
  'Zambia',
  'Malawi',
  'Botswana',
  'Namibia',
  'DR Congo',
  'Congo',
  'Gabon',
  'Togo',
  'Benin',
  'Burkina Faso',
  'Mali',
  'Niger',
  'Chad',
  'Sierra Leone',
  'Liberia',
  'Guinea',
  'Gambia',
  'Mauritius',
  'Madagascar',
  'Somalia',
  'Sudan',
  'Libya',
  'Eritrea',
  'Djibouti',
  'Equatorial Guinea',
  'Cape Verde',
  'Comoros',
  'Seychelles',
  'São Tomé and Príncipe',
  'Eswatini',
  'Lesotho',
  'Central African Republic',
  'South Sudan',
  'Mauritania',
] as const;

export type AfricanCountry = typeof AFRICAN_COUNTRIES[number];

/**
 * Try to detect country from venue/address text
 */
export const detectCountryFromText = (text: string): string | null => {
  const lowerText = text.toLowerCase();
  
  // City-to-country mapping for common African cities
  const cityMap: Record<string, string> = {
    'lagos': 'Nigeria',
    'abuja': 'Nigeria',
    'port harcourt': 'Nigeria',
    'ibadan': 'Nigeria',
    'kano': 'Nigeria',
    'enugu': 'Nigeria',
    'benin city': 'Nigeria',
    'calabar': 'Nigeria',
    'accra': 'Ghana',
    'kumasi': 'Ghana',
    'nairobi': 'Kenya',
    'mombasa': 'Kenya',
    'johannesburg': 'South Africa',
    'cape town': 'South Africa',
    'durban': 'South Africa',
    'pretoria': 'South Africa',
    'dar es salaam': 'Tanzania',
    'kampala': 'Uganda',
    'addis ababa': 'Ethiopia',
    'kigali': 'Rwanda',
    'douala': 'Cameroon',
    'yaoundé': 'Cameroon',
    'dakar': 'Senegal',
    'abidjan': 'Ivory Coast',
    'cairo': 'Egypt',
    'casablanca': 'Morocco',
    'algiers': 'Algeria',
    'tunis': 'Tunisia',
    'luanda': 'Angola',
    'maputo': 'Mozambique',
    'harare': 'Zimbabwe',
    'lusaka': 'Zambia',
    'lilongwe': 'Malawi',
    'gaborone': 'Botswana',
    'windhoek': 'Namibia',
    'kinshasa': 'DR Congo',
    'libreville': 'Gabon',
    'lomé': 'Togo',
    'cotonou': 'Benin',
    'freetown': 'Sierra Leone',
    'monrovia': 'Liberia',
    'conakry': 'Guinea',
    'banjul': 'Gambia',
    'port louis': 'Mauritius',
    'antananarivo': 'Madagascar',
    'mogadishu': 'Somalia',
    'khartoum': 'Sudan',
    'tripoli': 'Libya',
  };

  // Check city names first (more specific)
  for (const [city, country] of Object.entries(cityMap)) {
    if (lowerText.includes(city)) return country;
  }

  // Then check country names
  for (const country of AFRICAN_COUNTRIES) {
    if (lowerText.includes(country.toLowerCase())) return country;
  }

  return null;
};
