export const COMPANY = {
  legalName: "MAINI IN LUT SRL",
  brandName: "Mâini în lut",
  cui: "54003138",
  tradeRegister: "J2026011298005",
  euid: "ROONRC.J2026011298005",
  founded: "2026-02-18",
  email: "maini.in.lut@gmail.com",
  phone: "0771 032 007",
  phoneTel: "+40771032007",
  address: {
    county: "Sibiu",
    city: "Sibiu",
    street: "Str. Țiglări",
    block: "bl. A5",
    apartment: "ap. 42",
    postalCode: "550099",
  },
} as const;

export const COMPANY_ADDRESS_RO = `${COMPANY.address.city}, ${COMPANY.address.street}, ${COMPANY.address.block}, ${COMPANY.address.apartment}, cod poștal ${COMPANY.address.postalCode}`;

export const COMPANY_ADDRESS_EN = `${COMPANY.address.city}, ${COMPANY.address.street}, ${COMPANY.address.block}, apt. ${COMPANY.address.apartment.replace("ap. ", "")}, ${COMPANY.address.postalCode}`;
