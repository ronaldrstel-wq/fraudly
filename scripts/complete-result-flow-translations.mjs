#!/usr/bin/env node
/**
 * Merge embedded translations into lib/i18n/result-flow/translation-by-en.ts
 * Run: node scripts/complete-result-flow-translations.mjs
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const paths = JSON.parse(fs.readFileSync(path.join(root, "lib/i18n/result-flow/_paths.json"), "utf8"));
const uniq = [...new Set(paths.map(([, s]) => s))].sort();

const T = {};
function setAll(en, nl, de, fr, es, pt) {
  T[en] = { nl, de, fr, es, pt };
}

// Load existing
const existingPath = path.join(root, "lib/i18n/result-flow/translation-by-en.ts");
if (fs.existsSync(existingPath)) {
  const existing = fs.readFileSync(existingPath, "utf8");
  for (const m of existing.matchAll(
    /"((?:[^"\\]|\\.)*)": \{ nl: "((?:[^"\\]|\\.)*)", de: "((?:[^"\\]|\\.)*)", fr: "((?:[^"\\]|\\.)*)", es: "((?:[^"\\]|\\.)*)", pt: "((?:[^"\\]|\\.)*)"/g
  )) {
    const unesc = (s) => s.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    T[unesc(m[1])] = { nl: unesc(m[2]), de: unesc(m[3]), fr: unesc(m[4]), es: unesc(m[5]), pt: unesc(m[6]) };
  }
}

// --- Supplement: remaining scanResult / outcomes (batch 2) ---
setAll("Home", "Start", "Start", "Accueil", "Inicio", "Início");
setAll("Is ", "Is ", "Ist ", "Le site ", "¿Es ", "O site ");
setAll("Helpful signals & observations", "Nuttige signalen en observaties", "Hilfreiche Signale & Beobachtungen", "Signaux utiles et observations", "Señales útiles y observaciones", "Sinais úteis e observações");
setAll(
  "Structured hits from curated phishing, malware, or police-aligned feeds in this crawl.",
  "Gestructureerde hits uit gecureerde phishing-, malware- of politie-feeds in deze crawl.",
  "Strukturierte Treffer aus kuratierten Phishing-, Malware- oder Polizei-Feeds in diesem Crawl.",
  "Correspondances structurées de flux phishing, malware ou police dans ce crawl.",
  "Coincidencias estructuradas de feeds de phishing, malware o policía en este rastreo.",
  "Correspondências estruturadas de feeds de phishing, malware ou polícia nesta verificação."
);
setAll(
  "Extra risk-style signals scored in this snapshot. They are not definitive proof—a quick second opinion still helps.",
  "Extra risicosignalen in deze momentopname. Geen definitief bewijs—een second opinion helpt nog steeds.",
  "Zusätzliche Risikosignale in diesem Snapshot. Kein endgültiger Beweis—eine zweite Meinung hilft.",
  "Signaux de risque supplémentaires dans cet instantané. Pas une preuve définitive—un second avis aide.",
  "Señales de riesgo adicionales en esta instantánea. No son prueba definitiva—una segunda opinión ayuda.",
  "Sinais de risco adicionais neste instantâneo. Não são prova definitiva—uma segunda opinião ajuda."
);
setAll(
  "Facts and neutral checks that balance the picture. Missing a row usually means “not seen”, not proof either way.",
  "Feiten en neutrale controles die het beeld balanceren. Een ontbrekende rij betekent meestal “niet gezien”, geen bewijs.",
  "Fakten und neutrale Prüfungen für ein ausgewogenes Bild. Fehlende Zeile heißt meist „nicht gesehen“, kein Beweis.",
  "Faits et contrôles neutres qui équilibrent l’image. Une ligne manquante signifie souvent « non vu », pas une preuve.",
  "Hechos y comprobaciones neutras que equilibran el panorama. Una fila ausente suele significar «no visto», no prueba.",
  "Factos e verificações neutras que equilibram o quadro. Uma linha em falta geralmente significa «não visto», não prova."
);
setAll(
  "Normalized provider output. “Matched” means that source reported something relevant in this run.",
  "Genormaliseerde provideroutput. “Match” betekent dat die bron iets relevant meldde in deze run.",
  "Normalisierte Provider-Ausgabe. „Match“ bedeutet, dass die Quelle in diesem Lauf etwas Relevantes meldete.",
  "Sortie fournisseur normalisée. « Correspondance » signifie que la source a signalé quelque chose de pertinent.",
  "Salida de proveedor normalizada. «Coincidencia» significa que la fuente informó algo relevante en esta ejecución.",
  "Saída de fornecedor normalizada. «Correspondência» significa que a fonte reportou algo relevante nesta execução."
);
setAll(
  "Optional broader reputation pass when available—beyond the quick baseline probes.",
  "Optionele bredere reputatiepass wanneer beschikbaar—naast de snelle basisprobes.",
  "Optionaler breiterer Reputationsdurchlauf wenn verfügbar—über die schnellen Basisprobes hinaus.",
  "Passage réputation élargie optionnelle si disponible—au-delà des sondes de base rapides.",
  "Pase de reputación más amplio opcional cuando esté disponible—más allá de las comprobaciones base rápidas.",
  "Passagem de reputação mais ampla opcional quando disponível—além das verificações base rápidas."
);
setAll(
  "Checking reputation and security signals…",
  "Reputatie en beveiligingssignalen controleren…",
  "Reputation und Sicherheitssignale prüfen…",
  "Vérification de la réputation et des signaux de sécurité…",
  "Comprobando reputación y señales de seguridad…",
  "A verificar reputação e sinais de segurança…"
);
setAll(
  "Reputation enrichment unavailable right now—your baseline scan findings still apply.",
  "Reputatieverrijking nu niet beschikbaar—uw basisscanresultaten blijven gelden.",
  "Reputationsanreicherung derzeit nicht verfügbar—Ihre Basis-Scan-Ergebnisse gelten weiter.",
  "Enrichissement de réputation indisponible pour l’instant—les résultats de base s’appliquent toujours.",
  "Enriquecimiento de reputación no disponible ahora—siguen aplicando los hallazgos del análisis base.",
  "Enriquecimento de reputação indisponível agora—os resultados da verificação base continuam a aplicar-se."
);
setAll(
  "No enriched reputation profile surfaced. That limits context; it does not prove the site is unsafe.",
  "Geen verrijkt reputatieprofiel gevonden. Dat beperkt context; het bewijst niet dat de site onveilig is.",
  "Kein angereichertes Reputationsprofil. Das begrenzt den Kontext; es beweist keine Unsicherheit.",
  "Aucun profil de réputation enrichi. Cela limite le contexte ; cela ne prouve pas que le site est dangereux.",
  "No apareció un perfil de reputación enriquecido. Limita el contexto; no prueba que el sitio sea inseguro.",
  "Nenhum perfil de reputação enriquecido. Isso limita o contexto; não prova que o site é inseguro."
);
setAll(
  "Quick review probes (baseline scan)",
  "Snelle reviewprobes (basisscan)",
  "Schnelle Review-Sonden (Basisscan)",
  "Sondes d’avis rapides (scan de base)",
  "Comprobaciones rápidas de reseñas (análisis base)",
  "Sondas rápidas de avaliações (verificação base)"
);
setAll(
  "Lightweight directory checks powering part of the model—hiccups here describe our snapshot, not the shop’s honesty.",
  "Lichte directorycontroles voor het model—problemen hier beschrijven onze snapshot, niet de eerlijkheid van de winkel.",
  "Leichte Verzeichnisprüfungen für das Modell—Ausfälle beschreiben unseren Snapshot, nicht die Seriosität des Shops.",
  "Contrôles d’annuaires légers pour le modèle—les ratés décrivent notre instantané, pas l’honnêteté du site.",
  "Comprobaciones ligeras de directorios para el modelo—fallos aquí describen nuestra instantánea, no la honestidad de la tienda.",
  "Verificações leves de diretórios para o modelo—falhas aqui descrevem o nosso instantâneo, não a honestidade da loja."
);
setAll(
  "Scam intelligence weighting (model)",
  "Gewicht scam-informatie (model)",
  "Gewichtung Scam-Informationen (Modell)",
  "Pondération renseignement arnaque (modèle)",
  "Ponderación de inteligencia de estafas (modelo)",
  "Ponderação de inteligência de fraudes (modelo)"
);
setAll(
  "Review collector notes (neutral)",
  "Notities reviewverzamelaar (neutraal)",
  "Hinweise Review-Sammler (neutral)",
  "Notes collecteur d’avis (neutre)",
  "Notas del recolector de reseñas (neutral)",
  "Notas do recolhedor de avaliações (neutro)"
);
setAll(
  "Combined scoring signals (reviews, reputation, feeds, fulfillment…)",
  "Gecombineerde scoresignalen (reviews, reputatie, feeds, fulfillment…)",
  "Kombinierte Scoring-Signale (Bewertungen, Reputation, Feeds, Fulfillment…)",
  "Signaux de score combinés (avis, réputation, flux, exécution…)",
  "Señales de puntuación combinadas (reseñas, reputación, feeds, cumplimiento…)",
  "Sinais de pontuação combinados (avaliações, reputação, feeds, fulfillment…)"
);
setAll(
  "Blended notes from patterns we detected, scam intelligence scoring, and optional AI assistance—not legal or financial advice.",
  "Gemengde notities uit patronen, scam-informatiescores en optionele AI—geen juridisch of financieel advies.",
  "Gemischte Hinweise aus Mustern, Scam-Scoring und optionaler KI—keine Rechts- oder Finanzberatung.",
  "Notes combinées de motifs détectés, score arnaque et aide IA optionnelle—pas un conseil juridique ou financier.",
  "Notas combinadas de patrones detectados, puntuación de estafas y IA opcional—no es asesoramiento legal o financiero.",
  "Notas combinadas de padrões detetados, pontuação de fraudes e IA opcional—não é aconselhamento jurídico ou financeiro."
);
setAll(
  "Screenshots, ad notes, or social context are layered on top of the URL scan. They sharpen the story but never replace technical checks.",
  "Screenshots, advertentienotities of sociale context bovenop de URL-scan. Ze verduidelijken, maar vervangen geen technische controles.",
  "Screenshots, Anzeigenhinweise oder sozialer Kontext ergänzen den URL-Scan. Sie schärfen ein, ersetzen aber keine technischen Prüfungen.",
  "Captures, notes pub ou contexte social s’ajoutent au scan d’URL. Ils précisent sans remplacer les contrôles techniques.",
  "Capturas, notas de anuncios o contexto social se añaden al análisis de URL. Aclaran sin sustituir comprobaciones técnicas.",
  "Capturas, notas de anúncios ou contexto social complementam a verificação de URL. Esclarecem sem substituir verificações técnicas."
);
setAll(
  "Authoritative scam intelligence overrides the headline score so guidance stays cautious when feeds disagree with the numeric model.",
  "Gezaghebbende scam-informatie overschrijft de kopscore zodat advies voorzichtig blijft wanneer feeds afwijken van het model.",
  "Autoritative Scam-Informationen überschreiben den Kopfwert, damit die Empfehlung vorsichtig bleibt, wenn Feeds vom Modell abweichen.",
  "Le renseignement arnaque faisant autorité prime sur le score principal pour garder des conseils prudents si les flux divergent.",
  "La inteligencia de estafas autorizada anula la puntuación principal para mantener precaución si las fuentes discrepan del modelo.",
  "A inteligência de fraudes credível substitui a pontuação principal para manter cautela quando as fontes divergem do modelo."
);
setAll(
  "Limited public information available.",
  "Beperkte openbare informatie beschikbaar.",
  "Begrenzte öffentliche Informationen verfügbar.",
  "Informations publiques limitées disponibles.",
  "Información pública limitada disponible.",
  "Informação pública limitada disponível."
);
setAll(
  "At least one authoritative feed or reference flagged this host as malicious.",
  "Minstens één gezaghebbende feed of referentie markeerde deze host als kwaadaardig.",
  "Mindestens ein autoritativer Feed oder Verweis markierte diesen Host als schädlich.",
  "Au moins une source faisant autorité a signalé cet hôte comme malveillant.",
  "Al menos una fuente autorizada marcó este host como malicioso.",
  "Pelo menos uma fonte credível assinalou este host como malicioso."
);
setAll(
  "This website showed strong trust signals and no known phishing or malware list matches in this scan.",
  "Deze website toonde sterke vertrouwenssignalen en geen bekende phishing- of malwarelijstmatches in deze scan.",
  "Diese Website zeigte starke Vertrauenssignale und keine bekannten Phishing- oder Malware-Listen-Treffer.",
  "Ce site a montré de solides signaux de confiance et aucune correspondance de liste phishing/malware connue.",
  "Este sitio mostró señales de confianza sólidas y ninguna coincidencia en listas de phishing o malware conocidas.",
  "Este site mostrou sinais de confiança fortes e nenhuma correspondência em listas de phishing ou malware conhecidas."
);
setAll(
  "No major scam list matches appeared in this scan, though some automated checks were limited or worth a second look.",
  "Geen grote scamlijstmatches in deze scan, hoewel sommige geautomatiseerde controles beperkt waren of een tweede blik waard.",
  "Keine großen Scam-Listen-Treffer, obwohl einige automatische Prüfungen begrenzt waren oder einen zweiten Blick verdienen.",
  "Aucune grande correspondance de liste d’arnaque, bien que certains contrôles automatiques étaient limités.",
  "Sin coincidencias importantes en listas de estafas, aunque algunas comprobaciones automáticas fueron limitadas.",
  "Sem correspondências importantes em listas de fraudes, embora algumas verificações automáticas tenham sido limitadas."
);
setAll(
  "Some caution-style signals appeared—slow down before you trust links, logins, or checkout pages.",
  "Voorzichtigheidssignalen verschenen—vertraag voordat u links, logins of betaalpagina’s vertrouwt.",
  "Vorsichtssignale erschienen—langsamer werden vor Links, Logins oder Checkout-Seiten.",
  "Des signaux de prudence sont apparus—ralentissez avant de faire confiance aux liens, connexions ou paiements.",
  "Aparecieron señales de cautela—vaya más despacio antes de confiar en enlaces, inicios de sesión o pagos.",
  "Apareceram sinais de cautela—vá mais devagar antes de confiar em ligações, inícios de sessão ou pagamentos."
);
setAll(
  "Multiple concerning patterns appeared in this snapshot compared with typical benign sites.",
  "Meerdere zorgwekkende patronen in deze momentopname vergeleken met typische veilige sites.",
  "Mehrere besorgniserregende Muster in diesem Snapshot im Vergleich zu typischen harmlosen Sites.",
  "Plusieurs schémas préoccupants dans cet instantané par rapport à des sites habituellement sains.",
  "Varios patrones preocupantes en esta instantánea frente a sitios normalmente benignos.",
  "Vários padrões preocupantes neste instantâneo em comparação com sites normalmente benignos."
);
setAll(
  "Several concerning signals accumulated in this scan relative to typical benign sites.",
  "Meerdere zorgwekkende signalen verzamelden zich in deze scan ten opzichte van typische veilige sites.",
  "Mehrere besorgniserregende Signale sammelten sich in diesem Scan relativ zu harmlosen Sites.",
  "Plusieurs signaux préoccupants se sont accumulés dans ce scan par rapport à des sites sains typiques.",
  "Varias señales preocupantes se acumularon en este análisis respecto a sitios benignos típicos.",
  "Vários sinais preocupantes acumularam-se nesta verificação face a sites benignos típicos."
);
setAll(
  "DNS and registration checks did not corroborate this hostname as a live, registered apex.",
  "DNS- en registratiecontroles bevestigden deze hostnaam niet als live, geregistreerde apex.",
  "DNS- und Registrierungsprüfungen bestätigten diesen Hostnamen nicht als live, registrierte Apex.",
  "Les contrôles DNS et d’enregistrement n’ont pas corroboré ce nom d’hôte comme apex enregistré actif.",
  "Las comprobaciones DNS y de registro no corroboraron este hostname como apex registrado activo.",
  "As verificações DNS e de registo não corroboraram este hostname como apex registado ativo."
);
setAll(
  "The hostname may exist, but no usable website content was retrieved in this crawl.",
  "De hostnaam kan bestaan, maar er werd geen bruikbare website-inhoud opgehaald in deze crawl.",
  "Der Hostname existiert möglicherweise, aber es wurde kein nutzbarer Website-Inhalt abgerufen.",
  "Le nom d’hôte peut exister, mais aucun contenu web utilisable n’a été récupéré dans ce crawl.",
  "El hostname puede existir, pero no se recuperó contenido web utilizable en este rastreo.",
  "O hostname pode existir, mas não foi obtido conteúdo web utilizável nesta verificação."
);
setAll(
  "This website was flagged by phishing intelligence sources. Do not enter passwords, card numbers, or recovery codes.",
  "Deze website werd gemarkeerd door phishing-informatie. Voer geen wachtwoorden, kaartgegevens of herstelcodes in.",
  "Diese Website wurde von Phishing-Quellen markiert. Keine Passwörter, Kartendaten oder Wiederherstellungscodes eingeben.",
  "Ce site a été signalé par des sources phishing. N’entrez pas de mots de passe, numéros de carte ou codes de récupération.",
  "Este sitio fue marcado por fuentes de phishing. No introduzca contraseñas, tarjetas ni códigos de recuperación.",
  "Este site foi assinalado por fontes de phishing. Não introduza palavras-passe, cartões nem códigos de recuperação."
);
setAll(
  "Treat downloads and links as unsafe unless an independent security tool clears them.",
  "Behandel downloads en links als onveilig tenzij een onafhankelijke securitytool ze vrijgeeft.",
  "Behandeln Sie Downloads und Links als unsicher, bis ein unabhängiges Sicherheitstool sie freigibt.",
  "Traitez téléchargements et liens comme dangereux sauf si un outil de sécurité indépendant les valide.",
  "Trate descargas y enlaces como inseguros salvo que una herramienta de seguridad independiente los apruebe.",
  "Trate transferências e ligações como inseguras salvo confirmação por uma ferramenta de segurança independente."
);
setAll(
  "Treat this host as high risk until you can verify it through an official channel you opened yourself.",
  "Behandel deze host als hoog risico tot u via een officieel kanaal dat u zelf opende kunt verifiëren.",
  "Behandeln Sie diesen Host als hohes Risiko, bis Sie ihn über einen selbst geöffneten offiziellen Kanal verifizieren.",
  "Traitez cet hôte comme à haut risque jusqu’à vérification via un canal officiel ouvert par vous-même.",
  "Trate este host como alto riesgo hasta verificarlo por un canal oficial que usted mismo abrió.",
  "Trate este host como alto risco até o verificar por um canal oficial que abriu você mesmo."
);
setAll(
  "Avoid interacting with this site unless a trusted security professional or vendor clears it.",
  "Vermijd interactie met deze site tenzij een vertrouwde securityprofessional of leverancier het vrijgeeft.",
  "Vermeiden Sie Interaktion, bis ein vertrauenswürdiger Sicherheitsexperte oder Anbieter es freigibt.",
  "Évitez d’interagir avec ce site sauf si un professionnel ou fournisseur de confiance le valide.",
  "Evite interactuar con este sitio salvo que un profesional o proveedor de confianza lo apruebe.",
  "Evite interagir com este site salvo confirmação por um profissional ou fornecedor de confiança."
);
setAll(
  "Do not use this website for payments or sensitive data until the threat can be ruled out.",
  "Gebruik deze website niet voor betalingen of gevoelige gegevens tot de dreiging is uitgesloten.",
  "Nutzen Sie diese Website nicht für Zahlungen oder sensible Daten, bis die Bedrohung ausgeschlossen ist.",
  "N’utilisez pas ce site pour des paiements ou données sensibles tant que la menace n’est pas écartée.",
  "No use este sitio para pagos o datos sensibles hasta descartar la amenaza.",
  "Não use este site para pagamentos ou dados sensíveis até a ameaça ser descartada."
);
setAll(
  "No major risk indicators showed up in this scan—still use normal care with payments and personal data.",
  "Geen grote risico-indicatoren in deze scan—gebruik nog steeds normale voorzichtigheid bij betalingen en persoonsgegevens.",
  "Keine großen Risikoindikatoren—dennoch normale Vorsicht bei Zahlungen und persönlichen Daten.",
  "Aucun indicateur de risque majeur—restez prudent pour les paiements et données personnelles.",
  "Sin indicadores de riesgo mayores—siga siendo prudente con pagos y datos personales.",
  "Sem indicadores de risco maiores—mantenha cautela normal com pagamentos e dados pessoais."
);
setAll(
  "The snapshot looks broadly reassuring—if anything feels off, confirm the organisation through a channel you already trust.",
  "De momentopname oogt geruststellend—als iets niet klopt, bevestig de organisatie via een kanaal dat u vertrouwt.",
  "Der Snapshot wirkt beruhigend—wenn etwas seltsam ist, bestätigen Sie die Organisation über einen vertrauenswürdigen Kanal.",
  "L’instantané semble rassurant—si quelque chose cloche, confirmez l’organisation via un canal de confiance.",
  "La instantánea parece tranquilizadora—si algo no encaja, confirme la organización por un canal de confianza.",
  "O instantâneo parece tranquilizador—se algo parecer errado, confirme a organização por um canal de confiança."
);
setAll(
  "Use caution before signing in, paying, or downloading. Prefer contacting the company through a known official route.",
  "Wees voorzichtig vóór inloggen, betalen of downloaden. Neem liever contact op via een bekende officiële route.",
  "Vorsicht vor Anmeldung, Zahlung oder Download. Kontaktieren Sie das Unternehmen über einen bekannten offiziellen Weg.",
  "Soyez prudent avant connexion, paiement ou téléchargement. Contactez l’entreprise par une voie officielle connue.",
  "Tenga cuidado antes de iniciar sesión, pagar o descargar. Contacte la empresa por una vía oficial conocida.",
  "Tenha cuidado antes de iniciar sessão, pagar ou transferir. Prefira contactar a empresa por uma via oficial conhecida."
);
setAll(
  "Pause before payments or account changes—verify the business and URL through an independent source you trust.",
  "Pauzeer vóór betalingen of accountwijzigingen—verifieer bedrijf en URL via een onafhankelijke bron die u vertrouwt.",
  "Pause vor Zahlungen oder Kontoänderungen—verifizieren Sie Unternehmen und URL über eine unabhängige Quelle.",
  "Pausez avant paiements ou changements de compte—vérifiez l’entreprise et l’URL via une source indépendante.",
  "Pause antes de pagos o cambios de cuenta—verifique el negocio y la URL por una fuente independiente de confianza.",
  "Faça uma pausa antes de pagamentos ou alterações de conta—verifique o negócio e o URL por uma fonte independente."
);
setAll(
  "Avoid sharing personal or payment details until you can verify the site through a separate trusted source.",
  "Deel geen persoonlijke of betaalgegevens tot u de site via een aparte vertrouwde bron kunt verifiëren.",
  "Teilen Sie keine persönlichen oder Zahlungsdaten, bis Sie die Site über eine separate vertrauenswürdige Quelle prüfen.",
  "N’partagez pas de données personnelles ou de paiement tant que vous n’avez pas vérifié le site via une autre source.",
  "No comparta datos personales o de pago hasta verificar el sitio por una fuente de confianza aparte.",
  "Não partilhe dados pessoais ou de pagamento até verificar o site por uma fonte de confiança separada."
);
setAll(
  "Do not treat this hostname as a trustworthy business until registration and DNS look correct from your side.",
  "Behandel deze hostnaam niet als betrouwbaar bedrijf tot registratie en DNS vanuit uw kant kloppen.",
  "Behandeln Sie diesen Hostnamen nicht als vertrauenswürdig, bis Registrierung und DNS von Ihrer Seite stimmen.",
  "Ne considérez pas cet hôte comme une entreprise fiable tant que l’enregistrement et le DNS ne sont pas corrects pour vous.",
  "No trate este hostname como negocio fiable hasta que registro y DNS le parezcan correctos.",
  "Não trate este hostname como negócio fiável até o registo e DNS parecerem corretos do seu lado."
);
setAll(
  "If you expected a real store here, verify the URL with the brand through a channel you trust.",
  "Als u hier een echte winkel verwachtte, verifieer de URL bij het merk via een kanaal dat u vertrouwt.",
  "Wenn Sie hier einen echten Shop erwarteten, verifizieren Sie die URL beim Marken über einen vertrauenswürdigen Kanal.",
  "Si vous attendiez une vraie boutique, vérifiez l’URL auprès de la marque via un canal de confiance.",
  "Si esperaba una tienda real aquí, verifique la URL con la marca por un canal de confianza.",
  "Se esperava uma loja real aqui, verifique o URL com a marca por um canal de confiança."
);
setAll(
  "Do not trust this site for logins or payments unless independent corroboration contradicts the feeds.",
  "Vertrouw deze site niet voor logins of betalingen tenzij onafhankelijke bevestiging de feeds tegenspreekt.",
  "Vertrauen Sie dieser Site nicht für Logins oder Zahlungen, es sei denn, unabhängige Bestätigung widerspricht den Feeds.",
  "Ne faites pas confiance à ce site pour connexions ou paiements sauf corroboration indépendante contraire aux flux.",
  "No confíe en este sitio para inicios de sesión o pagos salvo corroboración independiente que contradiga las fuentes.",
  "Não confie neste site para inícios de sessão ou pagamentos salvo corroboração independente que contradiga as fontes."
);
setAll(
  "No major risk indicators showed up in this quick scan—still verify payments and identities as usual.",
  "Geen grote risico-indicatoren in deze snelle scan—verifieer betalingen en identiteiten nog steeds zoals gebruikelijk.",
  "Keine großen Risikoindikatoren in diesem Schnellscan—Zahlungen und Identitäten dennoch wie üblich prüfen.",
  "Aucun indicateur de risque majeur dans ce scan rapide—vérifiez tout de même paiements et identités.",
  "Sin indicadores de riesgo mayores en este análisis rápido—verifique pagos e identidades como de costumbre.",
  "Sem indicadores de risco maiores nesta verificação rápida—verifique pagamentos e identidades como habitualmente."
);
setAll(
  "Some risk signals were present. Prefer contacting the organization through a channel you already trust before paying or signing in.",
  "Er waren risicosignalen. Neem liever contact op via een kanaal dat u al vertrouwt vóór betalen of inloggen.",
  "Es gab Risikosignale. Kontaktieren Sie die Organisation über einen Kanal, dem Sie bereits vertrauen, vor Zahlung oder Login.",
  "Des signaux de risque étaient présents. Contactez l’organisation via un canal de confiance avant de payer ou vous connecter.",
  "Hubo señales de riesgo. Prefiera contactar la organización por un canal de confianza antes de pagar o iniciar sesión.",
  "Havia sinais de risco. Prefira contactar a organização por um canal de confiança antes de pagar ou iniciar sessão."
);
setAll(
  "Treat this as elevated risk until you can verify the site through an independent, official channel.",
  "Behandel dit als verhoogd risico tot u de site via een onafhankelijk officieel kanaal kunt verifiëren.",
  "Behandeln Sie dies als erhöhtes Risiko, bis Sie die Site über einen unabhängigen offiziellen Kanal verifizieren.",
  "Traitez cela comme un risque élevé jusqu’à vérification via un canal officiel indépendant.",
  "Trátelo como riesgo elevado hasta verificar el sitio por un canal oficial independiente.",
  "Trate isto como risco elevado até verificar o site por um canal oficial independente."
);
setAll(
  "The basic scan did not highlight major fraud indicators.",
  "De basisscan benadrukte geen grote fraude-indicatoren.",
  "Der Basisscan hob keine großen Betrugsindikatoren hervor.",
  "Le scan de base n’a pas mis en évidence d’indicateurs de fraude majeurs.",
  "El análisis básico no destacó indicadores importantes de fraude.",
  "A verificação básica não destacou indicadores importantes de fraude."
);
setAll(
  "Signals were found that merit extra caution.",
  "Er werden signalen gevonden die extra voorzichtigheid rechtvaardigen.",
  "Es wurden Signale gefunden, die zusätzliche Vorsicht rechtfertigen.",
  "Des signaux ont été trouvés qui méritent une prudence supplémentaire.",
  "Se encontraron señales que merecen cautela adicional.",
  "Foram encontrados sinais que justificam cautela extra."
);
setAll(
  "Multiple signals indicate an elevated fraud risk.",
  "Meerdere signalen wijzen op een verhoogd frauderisico.",
  "Mehrere Signale deuten auf ein erhöhtes Betrugsrisiko hin.",
  "Plusieurs signaux indiquent un risque de fraude élevé.",
  "Varias señales indican un riesgo de fraude elevado.",
  "Vários sinais indicam um risco de fraude elevado."
);
setAll(
  "This domain does not appear to exist or cannot be verified through DNS/RDAP systems. Scam and phishing campaigns often use disposable or malformed domains.",
  "Dit domein lijkt niet te bestaan of kan niet worden geverifieerd via DNS/RDAP. Scam- en phishingcampagnes gebruiken vaak wegwerp- of misvormde domeinen.",
  "Diese Domain scheint nicht zu existieren oder kann nicht über DNS/RDAP verifiziert werden. Betrüger nutzen oft Wegwerf- oder fehlerhafte Domains.",
  "Ce domaine ne semble pas exister ou ne peut pas être vérifié via DNS/RDAP. Les campagnes d’arnaque utilisent souvent des domaines jetables.",
  "Este dominio no parece existir o no puede verificarse por DNS/RDAP. Las campañas de estafa suelen usar dominios desechables.",
  "Este domínio não parece existir ou não pode ser verificado via DNS/RDAP. Campanhas de fraude usam frequentemente domínios descartáveis."
);
setAll(
  "No active registered domain could be verified via public DNS/RDAP in this crawl. Phantom hosts should not be read as trustworthy.",
  "Geen actief geregistreerd domein kon via openbare DNS/RDAP worden geverifieerd. Fantoomhosts zijn niet betrouwbaar.",
  "Keine aktiv registrierte Domain konnte über öffentliches DNS/RDAP verifiziert werden. Phantom-Hosts sind nicht vertrauenswürdig.",
  "Aucun domaine actif enregistré n’a pu être vérifié via DNS/RDAP public. Les hôtes fantômes ne sont pas fiables.",
  "No se pudo verificar un dominio activo registrado vía DNS/RDAP público. Los hosts fantasma no son fiables.",
  "Não foi possível verificar um domínio ativo registado via DNS/RDAP público. Hosts fantasma não são fiáveis."
);
setAll(
  "Fraudly did not run consumer-style trust grading because independent infrastructure checks did not corroborate a live registrable apex.",
  "Fraudly voerde geen consumenten-trustbeoordeling uit omdat infrastructuurcontroles geen live registreerbare apex bevestigden.",
  "Fraudly führte keine Verbraucher-Vertrauensbewertung durch, da Infrastrukturprüfungen keine live registrierbare Apex bestätigten.",
  "Fraudly n’a pas effectué de notation consommateur car les contrôles d’infrastructure n’ont pas confirmé d’apex enregistrable actif.",
  "Fraudly no aplicó calificación de confianza al consumidor porque las comprobaciones de infraestructura no corroboraron un apex registrable activo.",
  "A Fraudly não executou classificação de confiança para consumidores porque as verificações de infraestrutura não corroboraram um apex registável ativo."
);
setAll(
  "This hostname did not corroborate as a registered/resolvable apex in Fraudly's snapshot.",
  "Deze hostnaam werd niet bevestigd als geregistreerde/oplosbare apex in Fraudlys snapshot.",
  "Dieser Hostname wurde im Fraudly-Snapshot nicht als registrierte/auflösbare Apex bestätigt.",
  "Ce nom d’hôte n’a pas été corroboré comme apex enregistré/résolvable dans l’instantané Fraudly.",
  "Este hostname no se corroboró como apex registrado/resoluble en la instantánea de Fraudly.",
  "Este hostname não foi corroborado como apex registado/resolúvel no instantâneo da Fraudly."
);
setAll(
  "We have high certainty that actionable website trust evidence is missing—not that the hostname is benign.",
  "We hebben grote zekerheid dat bruikbaar vertrouwensbewijs ontbreekt—niet dat de hostnaam onschuldig is.",
  "Wir sind sehr sicher, dass verwertbare Vertrauensnachweise fehlen—nicht dass der Hostname harmlos ist.",
  "Nous sommes très certains que des preuves de confiance exploitables manquent—pas que l’hôte est bénin.",
  "Tenemos alta certeza de que faltan pruebas de confianza accionables—no de que el hostname sea benigno.",
  "Temos alta certeza de que faltam evidências de confiança acionáveis—não de que o hostname seja benigno."
);
setAll(
  "The domain appears to exist, but no active website could be reached in this crawl. This is common for parked names or dormant projects; it does not prove a scam.",
  "Het domein lijkt te bestaan, maar geen actieve website was bereikbaar in deze crawl. Vaak bij geparkeerde of slapende namen; geen bewijs van scam.",
  "Die Domain existiert, aber keine aktive Website war erreichbar. Häufig bei geparkten Namen—kein Scam-Beweis.",
  "Le domaine semble exister, mais aucun site actif n’a été joint. Courant pour noms parkés—pas une preuve d’arnaque.",
  "El dominio parece existir, pero no se alcanzó un sitio activo. Común en nombres aparcados—no prueba estafa.",
  "O domínio parece existir, mas nenhum site ativo foi alcançado. Comum em nomes parqueados—não prova fraude."
);
setAll(
  "Fraudly only sees public fetch/TLS probes here—thin pages, redirects, or bot-blocking can look similar to downtime.",
  "Fraudly ziet hier alleen openbare fetch/TLS-probes—dunne pagina’s, redirects of botblocking kunnen op downtime lijken.",
  "Fraudly sieht hier nur öffentliche Fetch/TLS-Sonden—dünne Seiten, Weiterleitungen oder Bot-Blocking können wie Ausfall wirken.",
  "Fraudly ne voit ici que des sondes fetch/TLS publiques—pages fines, redirections ou blocage de bots peuvent ressembler à une panne.",
  "Fraudly solo ve sondas fetch/TLS públicas aquí—páginas finas, redirecciones o bloqueo de bots pueden parecer inactividad.",
  "A Fraudly só vê sondas fetch/TLS públicas aqui—páginas finas, redirecionamentos ou bloqueio de bots podem parecer indisponibilidade."
);
setAll(
  "This reflects how much public and technical data was available during the scan. Limited data availability is not a risk signal by itself.",
  "Dit weerspiegelt hoeveel openbare en technische gegevens beschikbaar waren tijdens de scan. Beperkte data is op zich geen risicosignaal.",
  "Dies spiegelt wider, wie viele öffentliche und technische Daten verfügbar waren. Begrenzte Daten sind kein Risikosignal an sich.",
  "Cela reflète la quantité de données publiques et techniques disponibles. Des données limitées ne sont pas un signal de risque en soi.",
  "Esto refleja cuántos datos públicos y técnicos estuvieron disponibles. Datos limitados no son por sí solos una señal de riesgo.",
  "Isto reflete quantos dados públicos e técnicos estiveram disponíveis. Dados limitados não são por si um sinal de risco."
);
setAll(
  "Because no registered/resolvable apex was verified for consumer trust grading, Fraudly hides the trust score gauge for this hostname.",
  "Omdat geen geregistreerde/oplosbare apex werd geverifieerd, verbergt Fraudly de vertrouwensscore voor deze hostnaam.",
  "Da keine registrierte/auflösbare Apex verifiziert wurde, blendet Fraudly die Vertrauensanzeige für diesen Hostnamen aus.",
  "Comme aucun apex enregistré/résolvable n’a été vérifié, Fraudly masque le score de confiance pour cet hôte.",
  "Como no se verificó un apex registrado/resoluble, Fraudly oculta la puntuación de confianza para este hostname.",
  "Como nenhum apex registado/resolúvel foi verificado, a Fraudly oculta a pontuação de confiança para este hostname."
);

// New checkPage strings
setAll(
  "Related website checks",
  "Gerelateerde websitechecks",
  "Verwandte Website-Prüfungen",
  "Contrôles de sites associés",
  "Comprobaciones de sitios relacionados",
  "Verificações de sites relacionados"
);
setAll(
  "Other recently reviewed sites with similar risk signals, region, or naming patterns.",
  "Andere recent beoordeelde sites met vergelijkbare risicosignalen, regio of naampatronen.",
  "Andere kürzlich geprüfte Sites mit ähnlichen Risikosignalen, Region oder Namensmustern.",
  "Autres sites récemment examinés avec des signaux de risque, une région ou des noms similaires.",
  "Otros sitios revisados recientemente con señales de riesgo, región o patrones de nombre similares.",
  "Outros sites revistos recentemente com sinais de risco, região ou padrões de nome semelhantes."
);
setAll(
  "People also checked",
  "Anderen bekeken ook",
  "Andere prüften auch",
  "D’autres ont aussi vérifié",
  "Otros también comprobaron",
  "Outros também verificaram"
);
setAll(
  "Recent public checks from the Fraudly feed—explore other domains others are verifying.",
  "Recente openbare checks uit de Fraudly-feed—bekijk andere domeinen die anderen controleren.",
  "Aktuelle öffentliche Checks aus dem Fraudly-Feed—weitere Domains entdecken, die andere prüfen.",
  "Contrôles publics récents du flux Fraudly—explorez d’autres domaines que d’autres vérifient.",
  "Comprobaciones públicas recientes del feed de Fraudly—explore otros dominios que otros verifican.",
  "Verificações públicas recentes do feed Fraudly—explore outros domínios que outros estão a verificar."
);
setAll("View latest checks →", "Laatste checks bekijken →", "Neueste Checks ansehen →", "Voir les derniers contrôles →", "Ver últimas comprobaciones →", "Ver últimas verificações →");
setAll(
  "No Safe Browsing, OpenPhish, URLhaus, or police-aligned list matches were returned in this crawl.",
  "Geen Safe Browsing-, OpenPhish-, URLhaus- of politielijstmatches in deze crawl.",
  "Keine Safe-Browsing-, OpenPhish-, URLhaus- oder Polizeilisten-Treffer in diesem Crawl.",
  "Aucune correspondance Safe Browsing, OpenPhish, URLhaus ou liste police dans ce crawl.",
  "Sin coincidencias de Safe Browsing, OpenPhish, URLhaus o listas policiales en este rastreo.",
  "Sem correspondências Safe Browsing, OpenPhish, URLhaus ou listas policiais nesta verificação."
);
setAll(
  "No additional prioritized risk rows were raised beyond curated list matches.",
  "Geen extra geprioriteerde risicorijen buiten gecureerde lijstmatches.",
  "Keine zusätzlichen priorisierten Risikozeilen über kuratierte Listen-Treffer hinaus.",
  "Aucune ligne de risque prioritaire supplémentaire au-delà des correspondances de listes.",
  "Sin filas de riesgo priorizadas adicionales más allá de coincidencias de listas.",
  "Sem linhas de risco priorizadas adicionais além de correspondências de listas."
);
setAll(
  "No supportive or informational trust rows were returned.",
  "Geen ondersteunende of informatieve vertrouwensrijen geretourneerd.",
  "Keine unterstützenden oder informativen Vertrauenszeilen zurückgegeben.",
  "Aucune ligne de confiance supportive ou informative retournée.",
  "No se devolvieron filas de confianza de apoyo o informativas.",
  "Nenhuma linha de confiança de apoio ou informativa devolvida."
);
setAll(
  "Trust score unavailable for this snapshot.",
  "Vertrouwensscore niet beschikbaar voor deze momentopname.",
  "Vertrauenswert für diesen Snapshot nicht verfügbar.",
  "Score de confiance indisponible pour cet instantané.",
  "Puntuación de confianza no disponible para esta instantánea.",
  "Pontuação de confiança indisponível para este instantâneo."
);
setAll(
  "This website redirects to another domain. Fraudly also checked the final destination.",
  "Deze website leidt door naar een ander domein. Fraudly controleerde ook de eindbestemming.",
  "Diese Website leitet auf eine andere Domain um. Fraudly prüfte auch das Ziel.",
  "Ce site redirige vers un autre domaine. Fraudly a aussi vérifié la destination finale.",
  "Este sitio redirige a otro dominio. Fraudly también comprobó el destino final.",
  "Este site redireciona para outro domínio. A Fraudly também verificou o destino final."
);
setAll(
  "Website responded, but some page details could not be fully inspected during this scan.",
  "Website reageerde, maar sommige paginadetails konden niet volledig worden geïnspecteerd.",
  "Website antwortete, aber einige Seitendetails konnten nicht vollständig geprüft werden.",
  "Le site a répondu, mais certains détails n’ont pas pu être entièrement inspectés.",
  "El sitio respondió, pero algunos detalles no pudieron inspeccionarse por completo.",
  "O site respondeu, mas alguns detalhes não puderam ser totalmente inspecionados."
);
setAll("Registered domain:", "Geregistreerd domein:", "Registrierte Domain:", "Domaine enregistré :", "Dominio registrado:", "Domínio registado:");
setAll(
  "The submitted address is a subdomain. Fraudly also checked the registered domain because domain age and ownership belong to the root domain.",
  "Het ingediende adres is een subdomein. Fraudly controleerde ook het geregistreerde domein omdat leeftijd en eigendom bij het hoofddomein horen.",
  "Die eingegebene Adresse ist eine Subdomain. Fraudly prüfte auch die registrierte Domain, da Alter und Eigentum zur Root-Domain gehören.",
  "L’adresse soumise est un sous-domaine. Fraudly a aussi vérifié le domaine enregistré car l’âge et la propriété relèvent du domaine racine.",
  "La dirección enviada es un subdominio. Fraudly también comprobó el dominio registrado porque la antigüedad y la propiedad pertenecen al dominio raíz.",
  "O endereço enviado é um subdomínio. A Fraudly também verificou o domínio registado porque a idade e a propriedade pertencem ao domínio raiz."
);
setAll("Source:", "Bron:", "Quelle:", "Source :", "Fuente:", "Fonte:");
setAll(
  "Fraudly could not verify all trust signals for this website.",
  "Fraudly kon niet alle vertrouwenssignalen voor deze website verifiëren.",
  "Fraudly konnte nicht alle Vertrauenssignale für diese Website verifizieren.",
  "Fraudly n’a pas pu vérifier tous les signaux de confiance pour ce site.",
  "Fraudly no pudo verificar todas las señales de confianza de este sitio.",
  "A Fraudly não conseguiu verificar todos os sinais de confiança deste site."
);

setAll("Checked URL/hostname:", "Gecontroleerde URL/hostnaam:", "Geprüfte URL/Hostname:", "URL/nom d’hôte vérifié :", "URL/nombre de host comprobado:", "URL/nome de anfitrião verificado:");
setAll("Registration date:", "Registratiedatum:", "Registrierungsdatum:", "Date d’enregistrement :", "Fecha de registro:", "Data de registo:");
setAll("Domain age:", "Domeinleeftijd:", "Domain-Alter:", "Âge du domaine :", "Antigüedad del dominio:", "Idade do domínio:");
setAll("Registrar:", "Registrar:", "Registrar:", "Registrar :", "Registrador:", "Registador:");
setAll("Country:", "Land:", "Land:", "Pays :", "País:", "País:");
setAll("Expiration date:", "Vervaldatum:", "Ablaufdatum:", "Date d’expiration :", "Fecha de caducidad:", "Data de expiração:");
setAll(
  "Privacy / redacted ownership hints:",
  "Privacy / afgeschermde eigenaarsgegevens:",
  "Datenschutz / anonymisierte Inhaberhinweise:",
  "Confidentialité / indications de propriété masquées :",
  "Privacidad / indicios de titularidad ocultos:",
  "Privacidade / indícios de titularidade ocultos:"
);
setAll("Subdomain analysis:", "Subdomeinanalyse:", "Subdomain-Analyse:", "Analyse du sous-domaine :", "Análisis de subdominio:", "Análise de subdomínio:");
setAll("unknown", "onbekend", "unbekannt", "inconnu", "desconocido", "desconhecido");
setAll("yes", "ja", "ja", "oui", "sí", "sim");
setAll("no", "nee", "nein", "non", "no", "não");
setAll("no / unknown", "nee / onbekend", "nein / unbekannt", "non / inconnu", "no / desconocido", "não / desconhecido");
setAll("possible", "mogelijk", "möglich", "possible", "posible", "possível");
setAll(
  "Potentially risky wording found ({terms}).",
  "Mogelijk risicovolle formulering gevonden ({terms}).",
  "Möglicherweise riskante Formulierung gefunden ({terms}).",
  "Formulation potentiellement risquée trouvée ({terms}).",
  "Redacción potencialmente arriesgada encontrada ({terms}).",
  "Redação potencialmente arriscada encontrada ({terms})."
);
setAll(
  "No high-risk wording detected in subdomain labels.",
  "Geen formulering met hoog risico in subdomeinlabels.",
  "Keine Hochrisiko-Formulierung in Subdomain-Labels.",
  "Aucune formulation à haut risque dans les libellés du sous-domaine.",
  "No se detectó redacción de alto riesgo en etiquetas de subdominio.",
  "Nenhuma redação de alto risco detetada nos rótulos do subdomínio."
);
setAll("{label}: {score} out of 100", "{label}: {score} van 100", "{label}: {score} von 100", "{label} : {score} sur 100", "{label}: {score} de 100", "{label}: {score} de 100");
setAll("Data confidence", "Datavertrouwen", "Datenvertrauen", "Confiance des données", "Confianza de los datos", "Confiança dos dados");

// Glyphs stay identical (symbols)
for (const g of ["✓", "ⓘ", "⚠", "⛔"]) {
  setAll(g, g, g, g, g, g);
}

for (const en of uniq) {
  if (!T[en]) T[en] = { nl: en, de: en, fr: en, es: en, pt: en };
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

let out = 'import type { Locale } from "@/lib/i18n/locales";\n\n';
out += "type Row = Record<Exclude<Locale, \"en\">, string>;\n\n";
out += "/** English source string → localized copy. Regenerate: node scripts/complete-result-flow-translations.mjs */\n";
out += "export const TRANSLATION_BY_EN: Record<string, Row> = {\n";
for (const en of uniq) {
  const row = T[en];
  out += `  "${esc(en)}": { nl: "${esc(row.nl)}", de: "${esc(row.de)}", fr: "${esc(row.fr)}", es: "${esc(row.es)}", pt: "${esc(row.pt)}" },\n`;
}
out += "};\n";

fs.writeFileSync(existingPath, out);

const miss = (loc) => uniq.filter((en) => T[en][loc] === en).length;
console.log("Wrote", uniq.length, "entries");
for (const loc of ["nl", "de", "fr", "es", "pt"]) console.log(loc, "fallback", miss(loc));
