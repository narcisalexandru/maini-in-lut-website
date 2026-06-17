import type { LegalSection } from "~/components/LegalDocumentPage.vue";
import {
  COMPANY,
  COMPANY_ADDRESS_RO,
  COMPANY_ADDRESS_EN,
} from "~/constants/company";

const SELLER_RO =
  `${COMPANY.legalName}, CUI ${COMPANY.cui}, Nr. Reg. Com. ${COMPANY.tradeRegister}, cu sediul în ${COMPANY_ADDRESS_RO}, email ${COMPANY.email}, telefon ${COMPANY.phone}`;
const SELLER_EN =
  `${COMPANY.legalName}, VAT ID ${COMPANY.cui}, Trade Register no. ${COMPANY.tradeRegister}, registered address: ${COMPANY_ADDRESS_EN}, email ${COMPANY.email}, phone ${COMPANY.phone}`;

export const roTermsSections: LegalSection[] = [
  {
    id: "definitions",
    title: "1. Definiții și termeni",
    paragraphs: [
      `${SELLER_RO}, denumit în continuare „Vânzătorul”.`,
      "Site – magazinul online disponibil la adresa mainiinlut.ro și subdomeniile sale, inclusiv versiunile în limba română și engleză.",
      "Cumpărător – orice persoană fizică cu vârsta de peste 18 ani sau persoană juridică care plasează o Comandă pe Site.",
      "Utilizator – orice persoană care navighează pe Site sau își creează un Cont.",
      "Cont – secțiunea din Site asociată adresei de email și parolei, care permite plasarea Comenzilor și vizualizarea istoricului.",
      "Comandă – documentul electronic prin care Cumpărătorul își exprimă intenția de a achiziționa produsele selectate.",
      "Bunuri – produsele din ceramică handmade listate pe Site și menționate în Comandă.",
      "Contract – contractul la distanță încheiat între Vânzător și Cumpărător, fără prezența fizică simultană a părților.",
      "Document – prezentele Termeni și Condiții.",
      "Tranzacție – încasarea sau rambursarea sumei aferente unei Comenzi, prin procesatorul de plăți agreat sau prin plata ramburs.",
    ],
  },
  {
    id: "contractual",
    title: "2. Documente contractuale",
    paragraphs: [
      "Prin înregistrarea unei Comenzi pe Site, Cumpărătorul este de acord cu forma de comunicare (email sau telefon) prin care Vânzătorul derulează operațiunile comerciale.",
      "Confirmarea automată primită după plasarea Comenzii are rol informativ și nu reprezintă acceptarea Comenzii de către Vânzător.",
      "Contractul se consideră încheiat la momentul confirmării Comenzii de către Vânzător, comunicată prin email sau SMS, sau la momentul expedierii produselor, după caz.",
      "Pentru motive justificate (indisponibilitate stoc, eroare de preț, date incomplete), Vânzătorul poate modifica sau anula Comanda, cu informarea Cumpărătorului și returnarea sumelor achitate, dacă este cazul.",
      "Informațiile afișate pe Site la momentul plasării Comenzii stau la baza Contractului.",
    ],
  },
  {
    id: "sales-policy",
    title: "3. Politica de vânzare online",
    paragraphs: [
      "Comunicarea cu Vânzătorul se poate realiza prin pagina de Contact, la maini.in.lut@gmail.com sau la numărul de telefon afișat pe Site.",
      "Toate prețurile sunt exprimate în lei (RON) și includ TVA, acolo unde este cazul.",
      "Imaginile și descrierile produselor au caracter informativ. Produsele handmade pot prezenta variații naturale de culoare, textură sau formă, care nu sunt considerate defecte.",
      "Prețurile și disponibilitatea produselor pot fi modificate fără notificare prealabilă, însă modificările nu afectează Comenzile deja confirmate.",
      "În cazul plăților online, Vânzătorul nu este responsabil pentru comisioane bancare suplimentare (ex. conversie valutară) aplicate de banca emitentă a cardului Cumpărătorului.",
    ],
  },
  {
    id: "site-use",
    title: "4. Utilizarea site-ului",
    paragraphs: [
      "Accesul la Site și plasarea Comenzilor sunt permise în condițiile prezentului Document și ale legislației aplicabile.",
      "Este interzisă utilizarea abuzivă a Site-ului: furnizarea de date false, plasarea de comenzi fictive, tentative de acces neautorizat, copierea sau distribuirea neautorizată a conținutului.",
      "Vânzătorul își rezervă dreptul de a restricționa accesul la Cont sau de a refuza Comenzi în cazul încălcării acestor reguli.",
    ],
  },
  {
    id: "ip",
    title: "5. Proprietate intelectuală",
    paragraphs: [
      "Conținutul Site-ului (texte, imagini, logo, elemente grafice) este proprietatea Vânzătorului sau a partenerilor săi și este protejat de legislația privind drepturile de autor.",
      "Este interzisă copierea, reproducerea, distribuirea sau utilizarea comercială a conținutului fără acordul scris al Vânzătorului.",
      "Utilizatorul poate vizualiza și descărca conținut exclusiv în scop personal, necomercial.",
    ],
  },
  {
    id: "orders",
    title: "6. Comanda",
    paragraphs: [
      "Cumpărătorul poate plasa Comenzi prin adăugarea produselor în coș și finalizarea checkout-ului.",
      "Adăugarea unui produs în coș nu reprezintă rezervarea automată a acestuia.",
      "Prin finalizarea Comenzii, Cumpărătorul declară că toate datele furnizate sunt corecte, complete și actuale.",
      "Vânzătorul poate anula Comanda dacă: plata nu este acceptată de bancă sau procesator, datele furnizate sunt incomplete/incorecte, produsul nu mai este disponibil sau există suspiciuni de fraudă.",
      "Dacă un produs comandat nu poate fi livrat, Vânzătorul va informa Cumpărătorul și va returna contravaloarea acestuia în maximum 7 zile calendaristice.",
    ],
  },
  {
    id: "withdrawal",
    title: "7. Dreptul de retragere, retururi și reclamații",
    paragraphs: [
      "Persoanele fizice beneficiază de dreptul de retragere din Contract în termen de 14 zile calendaristice de la primirea produsului, fără a invoca un motiv, conform OUG nr. 34/2014.",
      "Termenul de 14 zile începe din ziua în care Cumpărătorul intră în posesia fizică a produsului.",
      "Pentru exercitarea dreptului de retragere, Cumpărătorul ne contactează la maini.in.lut@gmail.com sau prin pagina de Contact, menționând numărul comenzii.",
      "Produsul returnat trebuie să fie nefolosit, în ambalajul original, împreună cu eventualele accesorii. Cumpărătorul poate manipula produsul doar în măsura necesară stabilirii naturii, caracteristicilor și funcționării acestuia.",
      "Costurile directe de returnare sunt suportate de Cumpărător, cu excepția cazurilor în care produsul este defect sau livrat greșit.",
      "Rambursarea se efectuează în maximum 14 zile de la informarea privind retragerea, dar nu înainte de recepția produsului returnat sau de primirea dovezii expedierii acestuia.",
      "Rambursarea se face prin aceeași metodă de plată folosită la comandă (card, ramburs) sau prin transfer bancar, după caz.",
      "Pentru produse defecte sau deteriorate în transport, te rugăm să ne contactezi în maximum 48 de ore de la livrare, cu fotografii și detaliile comenzii.",
      "Dacă produsul returnat prezintă uzură peste limita permisă pentru testare, Vânzătorul poate reține o sumă proporțională cu diminuarea valorii.",
    ],
  },
  {
    id: "withdrawal-exceptions",
    title: "8. Excepții de la dreptul de retragere",
    paragraphs: [
      "Conform legislației, dreptul de retragere nu se aplică, printre altele, în cazul:",
      "produselor confecționate după specificațiile prezentate de Cumpărător sau personalizate în mod clar;",
      "produselor susceptibile a se deteriora rapid;",
      "produselor sigilate care nu pot fi returnate din motive de igienă, dacă au fost desigilate.",
      "Produsele realizate la comandă sau personalizate (ex. inscripții, dimensiuni speciale) pot fi exceptate de la dreptul de retragere, aspect comunicat înainte de confirmarea Comenzii.",
    ],
  },
  {
    id: "privacy",
    title: "9. Confidențialitate și date personale",
    paragraphs: [
      "Datele personale sunt prelucrate conform Politicii de prelucrare a datelor cu caracter personal, disponibilă pe Site.",
      "Utilizarea cookie-urilor este reglementată de Politica de utilizare Cookie-uri.",
      "Vânzătorul nu vinde date personale către terți. Datele pot fi partajate doar cu furnizori necesari pentru plată, livrare sau conformitate legală.",
    ],
  },
  {
    id: "marketing",
    title: "10. Comunicări comerciale",
    paragraphs: [
      "Cu acordul tău, putem trimite comunicări comerciale (newsletter, oferte) prin email.",
      "Te poți dezabona oricând folosind linkul din email sau contactându-ne la maini.in.lut@gmail.com.",
      "Comunicările legate de comenzi (confirmare, livrare, retur) nu necesită consimțământ marketing și sunt trimise în baza executării Contractului.",
    ],
  },
  {
    id: "billing",
    title: "11. Facturare și plată",
    paragraphs: [
      "Plata se poate efectua online cu cardul prin Netopia Payments sau ramburs la livrare, unde această opțiune este disponibilă.",
      "Taxa de livrare (15 RON) și taxa operațională pentru plata ramburs (5 RON), dacă este cazul, sunt afișate clar înainte de confirmarea Comenzii.",
      "Vânzătorul emite factura fiscală aferentă Comenzii, în format electronic, la adresa de email furnizată de Cumpărător.",
      `Identificarea fiscală a Vânzătorului: ${COMPANY.legalName}, CUI ${COMPANY.cui}, Nr. Reg. Com. ${COMPANY.tradeRegister}.`,
      "Prin plasarea Comenzii, Cumpărătorul acceptă primirea facturii în format electronic.",
      "Datele cardului nu sunt stocate de Vânzător; procesarea plăților online este efectuată de procesatorul de plăți autorizat.",
    ],
  },
  {
    id: "delivery",
    title: "12. Livrare",
    paragraphs: [
      "Livrarea se efectuează pe teritoriul României, la adresa indicată în Comandă.",
      "Termenul estimat de livrare este de 3–7 zile lucrătoare de la confirmarea Comenzii, în funcție de disponibilitatea produselor și de curier.",
      "Vânzătorul ambalează produsele cu grijă pentru transport. Riscul de deteriorare în timpul transportului revine curierului până la predarea coletului.",
      "La primire, te rugăm să verifici integritatea coletului. Deteriorările vizibile trebuie semnalate curierului și notificate Vânzătorului în 48 de ore.",
      "Întârzierile cauzate de factori în afara controlului Vânzătorului (condiții meteo, greve, forță majoră) nu dau dreptul la despăgubiri.",
    ],
  },
  {
    id: "warranty",
    title: "13. Produse handmade și garanții",
    paragraphs: [
      "Produsele sunt realizate manual; fiecare piesă este unică. Variațiile minore față de fotografiile de pe Site sunt normale.",
      "Produsele beneficiază de garanția legală de conformitate prevăzută de legislația în vigoare.",
      "Garanția nu acoperă deteriorări cauzate de utilizare necorespunzătoare, lovituri, cădere sau contact cu substanțe abrazive.",
      "Recomandăm consultarea informațiilor de îngrijire a ceramicii disponibile pe Site.",
    ],
  },
  {
    id: "liability",
    title: "14. Răspundere",
    paragraphs: [
      "Vânzătorul depune eforturi rezonabile pentru acuratețea informațiilor de pe Site, dar nu garantează absența erorilor tehnice temporare.",
      "Vânzătorul nu este responsabil pentru daune indirecte sau pierderi de profit rezultate din utilizarea Site-ului sau din întârzieri independente de voința sa.",
      "Cumpărătorul este responsabil pentru confidențialitatea datelor de acces la Cont.",
      "Vânzătorul își rezervă dreptul de a actualiza prezentul Document; versiunea aplicabilă este cea publicată pe Site la data plasării Comenzii.",
    ],
  },
  {
    id: "force-majeure",
    title: "15. Forță majoră",
    paragraphs: [
      "Niciuna dintre părți nu răspunde pentru neexecutarea obligațiilor dacă aceasta se datorează unui eveniment de forță majoră (eveniment imprevizibil, invincibil și exterior).",
      "Dacă evenimentul continuă mai mult de 15 zile, fiecare parte poate rezilia Contractul fără daune-interese.",
    ],
  },
  {
    id: "disputes",
    title: "16. Lege aplicabilă și soluționarea litigiilor",
    paragraphs: [
      "Prezentul Document este guvernat de legea română.",
      "Încercăm mai întâi rezolvarea amiabilă a oricăror neînțelegeri. Sesizările pot fi transmise la maini.in.lut@gmail.com sau prin pagina de Contact.",
      "Consumatorii se pot adresa Autorității Naționale pentru Protecția Consumatorilor (ANPC): www.anpc.ro.",
      "Platforma europeană de soluționare online a litigiilor (SOL) este disponibilă la https://ec.europa.eu/consumers/odr.",
      "În lipsa unei soluții amiabile, litigiile vor fi soluționate de instanțele judecătorești competente din România.",
    ],
  },
  {
    id: "final",
    title: "17. Dispoziții finale",
    paragraphs: [
      "Prin utilizarea Site-ului și plasarea Comenzilor, accepti prezentele Termeni și Condiții.",
      "Dacă o prevedere este declarată nevalidă, restul Documentului rămâne în vigoare.",
      "Pentru întrebări: maini.in.lut@gmail.com, 0771 032 007 sau pagina de Contact.",
    ],
  },
];

export const enTermsSections: LegalSection[] = [
  {
    id: "definitions",
    title: "1. Definitions and terms",
    paragraphs: [
      `${SELLER_EN}, hereinafter the "Seller".`,
      "Site – the online store available at mainiinlut.ro and its subdomains, including Romanian and English versions.",
      "Buyer – any natural person aged 18 or over or legal entity placing an Order on the Site.",
      "User – any person browsing the Site or creating an Account.",
      "Account – the section of the Site linked to an email address and password, enabling Orders and order history.",
      "Order – the electronic document through which the Buyer expresses the intention to purchase selected products.",
      "Goods – handmade ceramic products listed on the Site and mentioned in the Order.",
      "Contract – the distance contract concluded between Seller and Buyer without simultaneous physical presence.",
      "Document – these Terms and Conditions.",
      "Transaction – collection or refund of the amount related to an Order via the approved payment processor or cash on delivery.",
    ],
  },
  {
    id: "contractual",
    title: "2. Contractual documents",
    paragraphs: [
      "By placing an Order on the Site, the Buyer agrees to communication (email or phone) through which the Seller conducts commercial operations.",
      "Automatic confirmation received after placing an Order is informational and does not constitute acceptance by the Seller.",
      "The Contract is deemed concluded when the Seller confirms the Order by email or SMS, or when products are shipped, as applicable.",
      "For justified reasons (stock unavailability, pricing error, incomplete data), the Seller may modify or cancel the Order, informing the Buyer and refunding amounts paid where applicable.",
      "Information displayed on the Site at the time of ordering forms the basis of the Contract.",
    ],
  },
  {
    id: "sales-policy",
    title: "3. Online sales policy",
    paragraphs: [
      "You can contact the Seller via the Contact page, at maini.in.lut@gmail.com, or by phone as listed on the Site.",
      "All prices are in Romanian lei (RON) and include VAT where applicable.",
      "Product images and descriptions are informative. Handmade items may have natural variations in colour, texture, or shape, which are not considered defects.",
      "Prices and availability may change without prior notice, but changes do not affect confirmed Orders.",
      "For online payments, the Seller is not responsible for additional bank fees (e.g. currency conversion) charged by the Buyer's card issuer.",
    ],
  },
  {
    id: "site-use",
    title: "4. Use of the Site",
    paragraphs: [
      "Access to the Site and placing Orders are permitted under this Document and applicable law.",
      "Abusive use is prohibited: false data, fictitious orders, unauthorised access attempts, unauthorised copying or distribution of content.",
      "The Seller may restrict Account access or refuse Orders in case of breach.",
    ],
  },
  {
    id: "ip",
    title: "5. Intellectual property",
    paragraphs: [
      "Site content (text, images, logo, graphics) is owned by the Seller or partners and protected by copyright law.",
      "Copying, reproduction, distribution, or commercial use without written consent is prohibited.",
      "Users may view and download content for personal, non-commercial use only.",
    ],
  },
  {
    id: "orders",
    title: "6. Orders",
    paragraphs: [
      "Buyers place Orders by adding products to the cart and completing checkout.",
      "Adding a product to the cart does not automatically reserve it.",
      "By completing an Order, the Buyer declares that all provided data is correct, complete, and up to date.",
      "The Seller may cancel an Order if: payment is declined, data is incomplete/incorrect, the product is unavailable, or fraud is suspected.",
      "If an ordered product cannot be delivered, the Seller will inform the Buyer and refund its value within 7 calendar days.",
    ],
  },
  {
    id: "withdrawal",
    title: "7. Right of withdrawal, returns, and complaints",
    paragraphs: [
      "Consumers may withdraw from the Contract within 14 calendar days of receiving the product, without giving a reason, under applicable Romanian consumer law.",
      "The 14-day period starts on the day the Buyer takes physical possession of the product.",
      "To exercise withdrawal, contact us at maini.in.lut@gmail.com or via the Contact page with your order number.",
      "Returned products must be unused, in original packaging, with any accessories. The Buyer may handle the product only as necessary to establish its nature, characteristics, and functioning.",
      "Direct return shipping costs are borne by the Buyer, except when the product is defective or incorrectly delivered.",
      "Refunds are made within 14 days of withdrawal notice, but not before receipt of the return or proof of shipment.",
      "Refunds use the original payment method (card, cash on delivery) or bank transfer, as applicable.",
      "For defective products or shipping damage, contact us within 48 hours of delivery with photos and order details.",
      "If a returned product shows wear beyond permitted testing, the Seller may withhold an amount proportional to the decrease in value.",
    ],
  },
  {
    id: "withdrawal-exceptions",
    title: "8. Exceptions to the right of withdrawal",
    paragraphs: [
      "Under the law, the right of withdrawal does not apply, among others, to:",
      "goods made to the Buyer's specifications or clearly personalised;",
      "goods liable to deteriorate rapidly;",
      "sealed goods that cannot be returned for hygiene reasons if unsealed.",
      "Made-to-order or personalised products (e.g. inscriptions, custom sizes) may be excluded from withdrawal; this is communicated before Order confirmation.",
    ],
  },
  {
    id: "privacy",
    title: "9. Privacy and personal data",
    paragraphs: [
      "Personal data is processed according to our Privacy Policy, available on the Site.",
      "Cookie use is governed by our Cookie Policy.",
      "The Seller does not sell personal data. Data may be shared only with providers necessary for payment, delivery, or legal compliance.",
    ],
  },
  {
    id: "marketing",
    title: "10. Commercial communications",
    paragraphs: [
      "With your consent, we may send commercial communications (newsletter, offers) by email.",
      "You may unsubscribe at any time via the email link or by contacting maini.in.lut@gmail.com.",
      "Order-related communications (confirmation, delivery, returns) do not require marketing consent and are sent under Contract performance.",
    ],
  },
  {
    id: "billing",
    title: "11. Invoicing and payment",
    paragraphs: [
      "Payment can be made online by card via Netopia Payments or cash on delivery where available.",
      "Delivery fee (15 RON) and cash-on-delivery operational fee (5 RON), if applicable, are shown clearly before Order confirmation.",
      "The Seller issues a tax invoice for the Order electronically to the email provided.",
      `Seller tax identification: ${COMPANY.legalName}, VAT ID ${COMPANY.cui}, Trade Register no. ${COMPANY.tradeRegister}.`,
      "By placing an Order, the Buyer accepts receiving the invoice electronically.",
      "Card data is not stored by the Seller; online payments are processed by the authorised payment processor.",
    ],
  },
  {
    id: "delivery",
    title: "12. Delivery",
    paragraphs: [
      "Delivery is made within Romania to the address specified in the Order.",
      "Estimated delivery time is 3–7 business days from Order confirmation, depending on product availability and courier.",
      "Products are carefully packaged for transport. Transit risk passes to the courier until handover.",
      "Please check package integrity on receipt. Visible damage should be noted with the courier and reported to the Seller within 48 hours.",
      "Delays due to factors beyond the Seller's control (weather, strikes, force majeure) do not entitle the Buyer to compensation.",
    ],
  },
  {
    id: "warranty",
    title: "13. Handmade products and warranties",
    paragraphs: [
      "Products are handmade; each piece is unique. Minor variations from Site photos are normal.",
      "Products benefit from the legal conformity guarantee under applicable law.",
      "The guarantee does not cover damage from improper use, impacts, drops, or abrasive substances.",
      "We recommend the ceramic care information available on the Site.",
    ],
  },
  {
    id: "liability",
    title: "14. Liability",
    paragraphs: [
      "The Seller makes reasonable efforts to keep Site information accurate but does not guarantee absence of temporary technical errors.",
      "The Seller is not liable for indirect damages or lost profits from Site use or delays beyond its control.",
      "The Buyer is responsible for keeping Account credentials confidential.",
      "The Seller may update this Document; the applicable version is the one published on the Site at the time of ordering.",
    ],
  },
  {
    id: "force-majeure",
    title: "15. Force majeure",
    paragraphs: [
      "Neither party is liable for non-performance due to force majeure (unforeseeable, unavoidable, external events).",
      "If the event continues for more than 15 days, either party may terminate the Contract without damages.",
    ],
  },
  {
    id: "disputes",
    title: "16. Applicable law and dispute resolution",
    paragraphs: [
      "This Document is governed by Romanian law.",
      "We first seek amicable resolution. Complaints may be sent to maini.in.lut@gmail.com or via the Contact page.",
      "Consumers may contact the National Consumer Protection Authority (ANPC): www.anpc.ro.",
      "The EU Online Dispute Resolution platform (ODR) is available at https://ec.europa.eu/consumers/odr.",
      "If no amicable solution is reached, disputes shall be settled by competent Romanian courts.",
    ],
  },
  {
    id: "final",
    title: "17. Final provisions",
    paragraphs: [
      "By using the Site and placing Orders, you accept these Terms and Conditions.",
      "If any provision is held invalid, the remainder of the Document remains in effect.",
      "For questions: maini.in.lut@gmail.com, 0771 032 007, or the Contact page.",
    ],
  },
];
