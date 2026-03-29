import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Funzione helper per generare un ID
const generateId = () => {
  // Genera un ID simile a quelli usati da Prisma (cuid-like)
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
};

// Lista di nazioni predefinite per il popolamento automatico
// Updated: Fix apostrophe in Costa d'Avorio - Complete list ~195 nations
const DEFAULT_NATIONS = [
  { name: 'Italia', code: 'ITA', flag: '🇮🇹' },
  { name: 'Spagna', code: 'ESP', flag: '🇪🇸' },
  { name: 'Germania', code: 'GER', flag: '🇩🇪' },
  { name: 'Francia', code: 'FRA', flag: '🇫🇷' },
  { name: 'Inghilterra', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Portogallo', code: 'POR', flag: '🇵🇹' },
  { name: 'Brasile', code: 'BRA', flag: '🇧🇷' },
  { name: 'Argentina', code: 'ARG', flag: '🇦🇷' },
  { name: 'Olanda', code: 'NED', flag: '🇳🇱' },
  { name: 'Belgio', code: 'BEL', flag: '🇧🇪' },
  { name: 'Svizzera', code: 'SUI', flag: '🇨🇭' },
  { name: 'Austria', code: 'AUT', flag: '🇦🇹' },
  { name: 'Polonia', code: 'POL', flag: '🇵🇱' },
  { name: 'Ucraina', code: 'UKR', flag: '🇺🇦' },
  { name: 'Russia', code: 'RUS', flag: '🇷🇺' },
  { name: 'Turchia', code: 'TUR', flag: '🇹🇷' },
  { name: 'Grecia', code: 'GRE', flag: '🇬🇷' },
  { name: 'Svezia', code: 'SWE', flag: '🇸🇪' },
  { name: 'Norvegia', code: 'NOR', flag: '🇳🇴' },
  { name: 'Danimarca', code: 'DEN', flag: '🇩🇰' },
  { name: 'Finlandia', code: 'FIN', flag: '🇫🇮' },
  { name: 'Croazia', code: 'CRO', flag: '🇭🇷' },
  { name: 'Serbia', code: 'SRB', flag: '🇷🇸' },
  { name: 'Repubblica Ceca', code: 'CZE', flag: '🇨🇿' },
  { name: 'Romania', code: 'ROU', flag: '🇷🇴' },
  { name: 'Ungheria', code: 'HUN', flag: '🇭🇺' },
  { name: 'Messico', code: 'MEX', flag: '🇲🇽' },
  { name: 'Stati Uniti', code: 'USA', flag: '🇺🇸' },
  { name: 'Canada', code: 'CAN', flag: '🇨🇦' },
  { name: 'Uruguay', code: 'URU', flag: '🇺🇾' },
  { name: 'Colombia', code: 'COL', flag: '🇨🇴' },
  { name: 'Cile', code: 'CHI', flag: '🇨🇱' },
  { name: 'Giappone', code: 'JPN', flag: '🇯🇵' },
  { name: 'Corea del Sud', code: 'KOR', flag: '🇰🇷' },
  { name: 'Cina', code: 'CHN', flag: '🇨🇳' },
  { name: 'Australia', code: 'AUS', flag: '🇦🇺' },
  { name: 'Marocco', code: 'MAR', flag: '🇲🇦' },
  { name: 'Egitto', code: 'EGY', flag: '🇪🇬' },
  { name: 'Nigeria', code: 'NGA', flag: '🇳🇬' },
  { name: 'Sudafrica', code: 'RSA', flag: '🇿🇦' },
  { name: 'Senegal', code: 'SEN', flag: '🇸🇳' },
  { name: "Costa d'Avorio", code: 'CIV', flag: '🇨🇮' },
  // Europa - Altre nazioni
  { name: 'Albania', code: 'ALB', flag: '🇦🇱' },
  { name: 'Andorra', code: 'AND', flag: '🇦🇩' },
  { name: 'Armenia', code: 'ARM', flag: '🇦🇲' },
  { name: 'Azerbaigian', code: 'AZE', flag: '🇦🇿' },
  { name: 'Bielorussia', code: 'BLR', flag: '🇧🇾' },
  { name: 'Bosnia ed Erzegovina', code: 'BIH', flag: '🇧🇦' },
  { name: 'Bulgaria', code: 'BUL', flag: '🇧🇬' },
  { name: 'Cipro', code: 'CYP', flag: '🇨🇾' },
  { name: 'Estonia', code: 'EST', flag: '🇪🇪' },
  { name: 'Fær Øer', code: 'FRO', flag: '🇫🇴' },
  { name: 'Georgia', code: 'GEO', flag: '🇬🇪' },
  { name: 'Gibilterra', code: 'GIB', flag: '🇬🇮' },
  { name: 'Irlanda', code: 'IRL', flag: '🇮🇪' },
  { name: 'Islanda', code: 'ISL', flag: '🇮🇸' },
  { name: 'Israele', code: 'ISR', flag: '🇮🇱' },
  { name: 'Kazakistan', code: 'KAZ', flag: '🇰🇿' },
  { name: 'Kosovo', code: 'KOS', flag: '🇽🇰' },
  { name: 'Lettonia', code: 'LVA', flag: '🇱🇻' },
  { name: 'Liechtenstein', code: 'LIE', flag: '🇱🇮' },
  { name: 'Lituania', code: 'LTU', flag: '🇱🇹' },
  { name: 'Lussemburgo', code: 'LUX', flag: '🇱🇺' },
  { name: 'Macedonia del Nord', code: 'MKD', flag: '🇲🇰' },
  { name: 'Malta', code: 'MLT', flag: '🇲🇹' },
  { name: 'Moldavia', code: 'MDA', flag: '🇲🇩' },
  { name: 'Monaco', code: 'MCO', flag: '🇲🇨' },
  { name: 'Montenegro', code: 'MNE', flag: '🇲🇪' },
  { name: 'San Marino', code: 'SMR', flag: '🇸🇲' },
  { name: 'Scozia', code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { name: 'Slovacchia', code: 'SVK', flag: '🇸🇰' },
  { name: 'Slovenia', code: 'SVN', flag: '🇸🇮' },
  { name: 'Vaticano', code: 'VAT', flag: '🇻🇦' },
  // Nord America
  { name: 'Antigua e Barbuda', code: 'ATG', flag: '🇦🇬' },
  { name: 'Bahamas', code: 'BHS', flag: '🇧🇸' },
  { name: 'Barbados', code: 'BRB', flag: '🇧🇧' },
  { name: 'Belize', code: 'BLZ', flag: '🇧🇿' },
  { name: 'Costa Rica', code: 'CRI', flag: '🇨🇷' },
  { name: 'Cuba', code: 'CUB', flag: '🇨🇺' },
  { name: 'Dominica', code: 'DMA', flag: '🇩🇲' },
  { name: 'El Salvador', code: 'SLV', flag: '🇸🇻' },
  { name: 'Giamaica', code: 'JAM', flag: '🇯🇲' },
  { name: 'Grenada', code: 'GRD', flag: '🇬🇩' },
  { name: 'Guatemala', code: 'GTM', flag: '🇬🇹' },
  { name: 'Haiti', code: 'HTI', flag: '🇭🇹' },
  { name: 'Honduras', code: 'HND', flag: '🇭🇳' },
  { name: 'Nicaragua', code: 'NIC', flag: '🇳🇮' },
  { name: 'Panama', code: 'PAN', flag: '🇵🇦' },
  { name: 'Repubblica Dominicana', code: 'DOM', flag: '🇩🇴' },
  { name: 'Saint Kitts e Nevis', code: 'KNA', flag: '🇰🇳' },
  { name: 'Saint Lucia', code: 'LCA', flag: '🇱🇨' },
  { name: 'Saint Vincent e Grenadine', code: 'VCT', flag: '🇻🇨' },
  { name: 'Trinidad e Tobago', code: 'TTO', flag: '🇹🇹' },
  // Sud America
  { name: 'Bolivia', code: 'BOL', flag: '🇧🇴' },
  { name: 'Ecuador', code: 'ECU', flag: '🇪🇨' },
  { name: 'Guyana', code: 'GUY', flag: '🇬🇾' },
  { name: 'Paraguay', code: 'PRY', flag: '🇵🇾' },
  { name: 'Perù', code: 'PER', flag: '🇵🇪' },
  { name: 'Suriname', code: 'SUR', flag: '🇸🇷' },
  { name: 'Venezuela', code: 'VEN', flag: '🇻🇪' },
  // Asia
  { name: 'Afghanistan', code: 'AFG', flag: '🇦🇫' },
  { name: 'Arabia Saudita', code: 'KSA', flag: '🇸🇦' },
  { name: 'Bangladesh', code: 'BAN', flag: '🇧🇩' },
  { name: 'Bhutan', code: 'BHU', flag: '🇧🇹' },
  { name: 'Birmania', code: 'MMR', flag: '🇲🇲' },
  { name: 'Brunei', code: 'BRN', flag: '🇧🇳' },
  { name: 'Cambogia', code: 'CAM', flag: '🇰🇭' },
  { name: 'Corea del Nord', code: 'PRK', flag: '🇰🇵' },
  { name: 'Emirati Arabi Uniti', code: 'UAE', flag: '🇦🇪' },
  { name: 'Filippine', code: 'PHI', flag: '🇵🇭' },
  { name: 'Giordania', code: 'JOR', flag: '🇯🇴' },
  { name: 'India', code: 'IND', flag: '🇮🇳' },
  { name: 'Indonesia', code: 'IDN', flag: '🇮🇩' },
  { name: 'Iran', code: 'IRI', flag: '🇮🇷' },
  { name: 'Iraq', code: 'IRQ', flag: '🇮🇶' },
  { name: 'Kuwait', code: 'KUW', flag: '🇰🇼' },
  { name: 'Kirghizistan', code: 'KGZ', flag: '🇰🇬' },
  { name: 'Laos', code: 'LAO', flag: '🇱🇦' },
  { name: 'Libano', code: 'LBN', flag: '🇱🇧' },
  { name: 'Malesia', code: 'MAS', flag: '🇲🇾' },
  { name: 'Maldive', code: 'MDV', flag: '🇲🇻' },
  { name: 'Mongolia', code: 'MNG', flag: '🇲🇳' },
  { name: 'Nepal', code: 'NEP', flag: '🇳🇵' },
  { name: 'Oman', code: 'OMA', flag: '🇴🇲' },
  { name: 'Pakistan', code: 'PAK', flag: '🇵🇰' },
  { name: 'Qatar', code: 'QAT', flag: '🇶🇦' },
  { name: 'Singapore', code: 'SGP', flag: '🇸🇬' },
  { name: 'Siria', code: 'SYR', flag: '🇸🇾' },
  { name: 'Sri Lanka', code: 'SRI', flag: '🇱🇰' },
  { name: 'Tagikistan', code: 'TJK', flag: '🇹🇯' },
  { name: 'Taiwan', code: 'TPE', flag: '🇹🇼' },
  { name: 'Tailandia', code: 'THA', flag: '🇹🇭' },
  { name: 'Timor Est', code: 'TLS', flag: '🇹🇱' },
  { name: 'Turkmenistan', code: 'TKM', flag: '🇹🇲' },
  { name: 'Uzbekistan', code: 'UZB', flag: '🇺🇿' },
  { name: 'Vietnam', code: 'VIE', flag: '🇻🇳' },
  { name: 'Yemen', code: 'YEM', flag: '🇾🇪' },
  // Africa
  { name: 'Algeria', code: 'ALG', flag: '🇩🇿' },
  { name: 'Angola', code: 'ANG', flag: '🇦🇴' },
  { name: 'Benin', code: 'BEN', flag: '🇧🇯' },
  { name: 'Botswana', code: 'BOT', flag: '🇧🇼' },
  { name: 'Burkina Faso', code: 'BFA', flag: '🇧🇫' },
  { name: 'Burundi', code: 'BDI', flag: '🇧🇮' },
  { name: 'Camerun', code: 'CMR', flag: '🇨🇲' },
  { name: 'Capo Verde', code: 'CPV', flag: '🇨🇻' },
  { name: 'Ciad', code: 'CHA', flag: '🇹🇩' },
  { name: 'Comore', code: 'COM', flag: '🇰🇲' },
  { name: 'Congo', code: 'CGO', flag: '🇨🇬' },
  { name: 'Congo RDC', code: 'COD', flag: '🇨🇩' },
  { name: 'Djibouti', code: 'DJI', flag: '🇩🇯' },
  { name: 'Eritrea', code: 'ERI', flag: '🇪🇷' },
  { name: 'Eswatini', code: 'SWZ', flag: '🇸🇿' },
  { name: 'Etiopia', code: 'ETH', flag: '🇪🇹' },
  { name: 'Gabon', code: 'GAB', flag: '🇬🇦' },
  { name: 'Gambia', code: 'GAM', flag: '🇬🇲' },
  { name: 'Ghana', code: 'GHA', flag: '🇬🇭' },
  { name: 'Guinea', code: 'GUI', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', code: 'GBS', flag: '🇬🇼' },
  { name: 'Guinea Equatoriale', code: 'GEQ', flag: '🇬🇶' },
  { name: 'Kenya', code: 'KEN', flag: '🇰🇪' },
  { name: 'Lesotho', code: 'LES', flag: '🇱🇸' },
  { name: 'Liberia', code: 'LBR', flag: '🇱🇷' },
  { name: 'Libia', code: 'LBA', flag: '🇱🇾' },
  { name: 'Madagascar', code: 'MAD', flag: '🇲🇬' },
  { name: 'Malawi', code: 'MAW', flag: '🇲🇼' },
  { name: 'Mali', code: 'MLI', flag: '🇲🇱' },
  { name: 'Mauritania', code: 'MTN', flag: '🇲🇷' },
  { name: 'Mauritius', code: 'MRI', flag: '🇲🇺' },
  { name: 'Mozambico', code: 'MOZ', flag: '🇲🇿' },
  { name: 'Namibia', code: 'NAM', flag: '🇳🇦' },
  { name: 'Niger', code: 'NIG', flag: '🇳🇪' },
  { name: 'Ruanda', code: 'RWA', flag: '🇷🇼' },
  { name: 'Sahara Occidentale', code: 'SAH', flag: '🇪🇭' },
  { name: 'Seychelles', code: 'SEY', flag: '🇸🇨' },
  { name: 'Sierra Leone', code: 'SLE', flag: '🇸🇱' },
  { name: 'Somalia', code: 'SOM', flag: '🇸🇴' },
  { name: 'Tanzania', code: 'TAN', flag: '🇹🇿' },
  { name: 'Togo', code: 'TOG', flag: '🇹🇬' },
  { name: 'Tunisia', code: 'TUN', flag: '🇹🇳' },
  { name: 'Uganda', code: 'UGA', flag: '🇺🇬' },
  { name: 'Zambia', code: 'ZAM', flag: '🇿🇲' },
  { name: 'Zimbabwe', code: 'ZIM', flag: '🇿🇼' },
  // Oceania
  { name: 'Fiji', code: 'FIJ', flag: '🇫🇯' },
  { name: 'Kiribati', code: 'KIR', flag: '🇰🇮' },
  { name: 'Isole Marshall', code: 'MHL', flag: '🇲🇭' },
  { name: 'Micronesia', code: 'FSM', flag: '🇫🇲' },
  { name: 'Nauru', code: 'NRU', flag: '🇳🇷' },
  { name: 'Nuova Zelanda', code: 'NZL', flag: '🇳🇿' },
  { name: 'Palau', code: 'PLW', flag: '🇵🇼' },
  { name: 'Papua Nuova Guinea', code: 'PNG', flag: '🇵🇬' },
  { name: 'Isole Salomone', code: 'SOL', flag: '🇸🇧' },
  { name: 'Samoa', code: 'SAM', flag: '🇼🇸' },
  { name: 'Tonga', code: 'TGA', flag: '🇹🇴' },
  { name: 'Tuvalu', code: 'TUV', flag: '🇹🇻' },
  { name: 'Vanuatu', code: 'VAN', flag: '🇻🇺' },
  // Altre
  { name: 'Irlanda del Nord', code: 'NIR', flag: '🇬🇧' },
  { name: 'Galles', code: 'WAL', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { name: 'Bermuda', code: 'BER', flag: '🇧🇲' },
  { name: 'Greenland', code: 'GRL', flag: '🇬🇱' },
  { name: 'Guam', code: 'GUM', flag: '🇬🇺' },
  { name: 'Hong Kong', code: 'HKG', flag: '🇭🇰' },
  { name: 'Macao', code: 'MAC', flag: '🇲🇴' },
  { name: 'Nuova Caledonia', code: 'NCL', flag: '🇳🇨' },
  { name: 'Puerto Rico', code: 'PUR', flag: '🇵🇷' },
  { name: 'Taipei Cinese', code: 'TPE', flag: '🇹🇼' },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    const nations = await db.nation.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { code: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(nations);
  } catch (error) {
    console.error('Error fetching nations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Prova a leggere il body della richiesta
    let body: { name?: string; code?: string; flag?: string } | null = null;
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // Se il parsing fallisce, body rimane null
    }

    // Se non c'è un body valido, popola con le nazioni predefinite
    if (!body || Object.keys(body).length === 0) {
      // Verifica se ci sono già nazioni nel database
      const existingCount = await db.nation.count();

      if (existingCount > 0) {
        return NextResponse.json(
          { error: 'Nations already exist in database', count: existingCount },
          { status: 409 }
        );
      }

      // Inserisci le nazioni predefinite
      let createdCount = 0;
      for (const nation of DEFAULT_NATIONS) {
        try {
          await db.nation.create({
            data: {
              id: generateId(),
              name: nation.name,
              code: nation.code,
              flag: nation.flag,
              updatedAt: new Date(),
            },
          });
          createdCount++;
        } catch (error) {
          // Se una nazione esiste già, continua con le altre
          console.log(`Nation ${nation.name} might already exist, skipping`);
        }
      }

      return NextResponse.json({ count: createdCount }, { status: 201 });
    }

    // Se c'è un body, crea una singola nazione
    // Verifica se esiste già una nazione con lo stesso nome o codice
    const existingNation = await db.nation.findFirst({
      where: {
        OR: [
          { name: body.name },
          { code: body.code },
        ],
      },
    });

    if (existingNation) {
      return NextResponse.json(
        { error: 'A nation with this name or code already exists' },
        { status: 409 }
      );
    }

    const nation = await db.nation.create({
      data: {
        id: generateId(),
        name: body.name!,
        code: body.code!,
        flag: body.flag || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(nation, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/nations:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Elimina tutte le nazioni dal database
    await db.nation.deleteMany({});

    return NextResponse.json(
      { message: 'All nations deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting nations:', error);
    return NextResponse.json(
      { error: 'Failed to delete nations' },
      { status: 500 }
    );
  }
}
