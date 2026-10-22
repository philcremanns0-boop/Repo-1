// Ordnet einem Vornamen eine Figur zu: 'boy' = Seb, 'girl' = Mia.
// Namenslisten (EN/ES/DE) + Endungs-Heuristik. Wer nicht passt, kann im Menü umschalten.
const M = `adam alan albert alex alexander alfonso alberto alejandro andre andreas andres angel anton antonio arthur ben benedikt benjamin bernd bruno carlos cesar chris christian christopher claudio cristian cristobal damian daniel dario david diego dominik dylan eduardo elias emil emilio enrique eric erik ernesto fabian fabio felipe felix fernando florian francisco frank franz gabriel gaston george gonzalo gregor guillermo gustavo hannes hans harry heinz henry hugo ian ignacio ivan jacob jakob james jan jannik jason javier jens jeremy jesus joachim joaquin joel johannes john jonas jonathan jorge jose josef joseph juan julian julio justin kai karl kevin klaus konstantin lars leon leonardo leo lorenzo lucas luis luka lukas manuel marc marcel marco marcos mario markus martin mateo matias matt matthew matthias max maximilian miguel mike mikel moritz nathan nico nicolas niklas noah oliver omar oscar pablo patrick paul pedro peter philipp pierre rafael ramon raul ricardo richard robert roberto rodrigo roman ruben ryan sam samuel sandro santiago sascha sebastian sergio simon stefan stephan steve sven theo thomas tim timo tobias tom tomas victor vicente vincent walter wilhelm william xavier yannick`.split(/\s+/);
const F = `abby abigail adriana agustina alejandra alexandra alice alicia alina amanda amelie amy ana anabel anastasia andrea angela angelika anika anja ann anna annabel anne annika antonia ashley barbara beatriz bea bianca camila camille carla carmen carolina caroline catalina catherine celia charlotte chiara christina clara claudia constanza cristina daniela daniella david_ diana dominique elena eleonora elisa elisabeth elise ella ellen emilia emily emma erika eva evelyn fabiola fiona florencia francesca franziska frida gabriela gabriele gemma georgia gisela giulia hanna hannah heidi helena helen ines ingrid irene isabel isabella isabelle jana jane janina jasmin jennifer jessica joanna josefina josephine julia juliane juliette karen karin karina karla katarina katharina katja kathrin katrin kristina laura lea leah lena leonie lilly lily lina lisa lola lorena louisa lucia luisa luna lydia magdalena maite mara margarita margot maria mariana marie marina marta martina mary matilda mia michelle miriam monica monika nadine natalia natalie nicole nina noelia olivia pamela patricia paula pauline paulina petra pia rachel rebecca rocio rosa ruth sabine sabrina sandra sara sarah sofia sophia sophie stefanie stephanie susan susanne tamara tania tatiana teresa theresa tina valentina valeria vanessa vera veronica victoria viktoria vivian xenia yasmin zoe`.split(/\s+/);
const MS = new Set(M), FS = new Set(F);

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\s-]/g, '').trim().split(/[\s-]+/)[0] || '';

export function guessLook(name) {
  const n = norm(name);
  if (!n) return 'boy';
  if (MS.has(n)) return 'boy';
  if (FS.has(n)) return 'girl';
  // männliche Namen, die auf -a / -e / -i enden
  if (/^(luca|elia|nikita|sasha|jona|joshua|mustafa|noe|jose|felipe|andre|rene|tobe|jesse|dave|mike|steve|luke|pete|gabe|kobe|ike|joe|ale|ari|rami|toni|tommi|benni|nici)$/.test(n)) return 'boy';
  if (/(a|ia|ie|ine|ina|elle|ette|lyn|lynn|een|ee|ey|y|i|e)$/.test(n) && !/(o|er|us|os|ik|an|en|on)$/.test(n)) return 'girl';
  if (/(ita|ela|ana|ara|ira|ura|ula|ela|ika|ike|iel)$/.test(n)) return n.endsWith('iel') ? 'boy' : 'girl';
  return 'boy';
}
