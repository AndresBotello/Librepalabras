/**
 * Contenido fijo del Grupo Focal Alfredo Correa De Andreís.
 *
 * Vive aquí y no en la página para que corregir la semblanza o el texto de
 * fondo sea editar un archivo de datos, sin tocar el maquetado. Los encuentros
 * (reuniones y temas) sí son dinámicos y los administra el panel de admin.
 */

export const FOCUS_GROUP_NAME = 'Grupo Focal Alfredo Correa De Andreís';

export const FOCUS_GROUP_MOTTO = 'Nos hace falta ser más sentipensantes y menos racionalistas';

export const FOCUS_GROUP_INTRO =
  'Un espacio de encuentro y pensamiento crítico de Librepalabras. Nos reunimos por videollamada ' +
  'en la Cátedra —con fecha, hora y enlace— y abrimos temas en la Tertulia para debatir sin prisa, ' +
  'cada quien a su tiempo, en la conversación de cada publicación.';

/**
 * Cómo se nombra cada modalidad de cara a quien lee. Los valores que se guardan
 * en Firestore siguen siendo 'sincronico' y 'asincronico' —son datos, no texto—,
 * pero esas dos palabras no aparecen en ninguna pantalla: el grupo prefiere
 * nombrar sus dos formas de reunirse con el nombre del homenajeado.
 *
 * Todo el texto visible sale de aquí para que renombrar sea editar un objeto y
 * no perseguir cadenas por cinco archivos.
 */
export const SESSION_KINDS = {
  sincronico: {
    name: 'Cátedra Alfredo Correa De Andreís',
    short: 'Cátedra',
    intro: 'Reuniones por videollamada con fecha, hora y enlace. Entra a la ficha del encuentro para conectarte.',
    empty: 'No hay cátedras programadas por ahora. Vuelve pronto.',
  },
  asincronico: {
    name: 'Tertulia Alfredo Correa De Andreís',
    short: 'Tertulia',
    intro: 'Temas abiertos, sin hora fija: lee el planteamiento y deja tu comentario cuando puedas.',
    empty: 'Todavía no hay temas abiertos en la tertulia.',
  },
};

/**
 * Semblanza. Se ciñe a lo documentado públicamente sobre el caso; si el grupo
 * quiere ampliarla con datos propios, este es el único sitio que hay que tocar.
 */
export const ALFREDO_CORREA_BIO = [
  'Alfredo Correa De Andreís fue sociólogo, investigador y profesor universitario del Caribe ' +
    'colombiano. Dedicó su trabajo académico a estudiar el desplazamiento forzado y las condiciones ' +
    'de vida de las comunidades desplazadas por el conflicto armado, y ejerció la docencia en ' +
    'universidades de Barranquilla y de la región.',
  'En 2004 fue señalado y detenido bajo acusaciones que la justicia terminó desestimando. Recuperó ' +
    'la libertad, pero la estigmatización pública que dejó aquel señalamiento lo convirtió en blanco.',
  'El viernes 17 de septiembre de 2004, a las 2:20 de la tarde, fue asesinado por sicarios en la ' +
    'carrera 53 con calle 60 de Barranquilla, junto a su escolta Edelberto Ochoa Martínez. Las ' +
    'personas que presenciaron los homicidios declararon que sus últimas palabras fueron: ' +
    '"¡Ey, loco, no dispares!".',
  'Este grupo focal lleva su nombre como un ejercicio de memoria: pensar en voz alta, discutir con ' +
    'argumentos y no con disparos, y sostener la palabra como forma de convivencia.',
];

/** Texto de fondo que da nombre y sentido al grupo. */
export const FOUNDING_ESSAY = {
  title: '¡Ey loco, no dispares!',
  author: 'Osmen Ospino Zárate',
  role: 'Docente y escritor',
  paragraphs: [
    'La joven sonríe. Viste blusa blanca, jeans azul ajustado, zapatos de marca. Lleva en la mano derecha una carpeta con varias planillas vacías. Rubia, piel blanca, estrato 6. Lo que hace, lo hace porque cree que es lo que le conviene al país. Me sonríe con la blancura de la ingenuidad regada en el rostro. – Buenos días señor: ¿me regala su firma para que el Presidente Santos no le entregue el país a las FARC? - Tiene veinte años y lleva la cabellera recogida en un rozagante moño color azul. Observo la planilla, la observo a ella, y le contesto, -Joven, yo no firmo para que haya más muertos, más hambre, más cerebros vacíos- La sonrisa se le congeló por un instante, me da la espalda, está sudando, Valledupar nada en 42 grados de temperatura, por los lados de la Sierra nevada asoma la trompa otro apocalíptico aguacero.',
    'Es un hecho: la jovencita que recoge firmas en las calles de Colombia para colocarle un palo a la rueda que moviliza la locomotora de la paz, ha visto o a leído el cruento guión con que se ha escrito la historia del país. 1, 2, 3, cámara, acción: “la bala entra en la recámara, se acciona el gatillo y el martillazo activa la ojiva que sale del cañón directo a su objetivo, elimina en segundos al opositor. La palabra puede tener el mismo poder y el mismo efecto, pero no elimina al opositor, sino que anula su argumento, neutraliza su intención, desbarata el fundamento. Para accionar el arma sólo se necesita una dosis alta de cobardía, para accionar la palabra se necesita el toque sereno de la inteligencia. Es eso lo que le faltó sistemáticamente a nuestra clase política, inteligencia para persuadir, argumentos para movilizar, ideas para llegar al poder, y la única vía que les quedó fue promover el caos y atizar los odios” (Villamizar, 2016). Ella cree que lo que sucede en Colombia es una guerra entre buenos y malos, disfrutar un helado en el Centro comercial de moda o wasapear hasta matar la última neurona con sus amigas de la U.',
    'La joven anónima llenó las 10 planillas con 20 firmas cada una. Le duelen las uñas de los pies y huele a perfume fino a pesar que sudó a raudales por la causa encomendada. Lo hizo de gratis, como quien asiste a una velada romántica en alguno de los clubes glamorosos que están ubicados al norte de la ciudad. A otros les pagaron a 50.000 pesos el día por la misma labor. La primera jovencita lo hace por gusto, como cuando vitrinea en las tiendas sofisticadas de Miami, o discute acaloradamente la conveniencia de la amistad entre Justin Bieber y Neymar. Los otros o las otras van detrás del pírrico dinero para ayudar en la casa, para completar la plata que le permita comprar la pulsera de sus sueños. Sin pensarlo accionan al unísono el gatillo que los matará o matará a uno de sus familiares o amigos.',
    '¿Quién o quiénes están detrás de tan magna gesta democrática?: los padres de la antidemocracia más rancia y linajuda del continente. Les sirve la respuesta. ¿Quiénes están detrás de la financiación, logística y recolección de firmas para que continúe la guerra?: una pequeña élite de personajes que han vivido del negocio de la violencia, pero hoy, maquillan su descontento elaborando resignificaciones dantescas alrededor de la palabra impunidad. ¿No les gusta la respuesta? Pues no hay otra.',
    'Por supuesto que el concepto de impunidad cambia sustancialmente de sentido dependiendo de la orilla del conflicto que se le mire. Cuando hace parte del apellido luminoso y honorable de un político, empresario, dignatario o ex dignatario del Estado se suaviza con la denominación de persecución política. Pero cuando hace parte de las ilusiones, utópicas, dicho sea de paso, de la mayoría de los colombianos de a pie, entonces recobra el significado políticamente correcto: falta de castigo.',
    'Cada vez existen menos dudas, pero también cada día más personas incapaces de comprender que los que han eludido históricamente el castigo, sean los que solicitan por las vías democráticas castigar. Poseen una moral frágil: navegan en la legalidad cuando aparece la luz del día, pero cuando cae la noche se colocan el pasamontaña a nombre de la patria.',
    'Evidentemente la opinión y los argumentos de la sociedad colombiana es concreta y apabullante: los políticos desde sus cargos o cuando están viudos de poder desarrollan la habilidad de la mentira perfeccionada. Para colmo algunos medios masivos de comunicación apoyados en ese hermoso precepto de la libertad de expresión informan todo y de todo, aun sabiendo que le pueden estar haciendo apología a la violencia y convirtiéndose en propagandistas gratuitos de los violentos.',
    'Los personajes de la política y sus “medios” fabrican verdades a medias, por un lado, dicen tener principios, pero sus palabras no valen un peso, y de manera premeditada, se venden al mejor postor. Voy a tratar de entenderlos: pueden ser corruptos de profesión y defensores acérrimos de la democracia. ¡Increíble! Pueden bombardear, enlodar, despotricar, delinquir y asesinar, y sin despeinarse, ser alcaldes, congresistas, ex presidentes, pastores, “dotores”, curas… Impensable.',
    'Mejor dicho, cuando en una calle de su ciudad, pueblo o vereda, una jovencita o un jovencito, casi siempre elegante les comunique con voz empalagosa y estudiada: – Buenos días señor: ¿me regala su firma para que el Presidente Santos no le entregue el país a las FARC?, piensen en las últimas palabras que expresó el Profesor Alfredo Correa de Andreís unos segundos antes de ser asesinado por sicarios: ¡Ey loco, no dispares!',
    'Es decir, cuando en una discusión de esquina, en el debate recurrente de una reunión de universitarios o en la tertulia a la espera del próximo partido de la Selección de fútbol de Colombia, una joven, un viejo o una dama con acento agresivo recuerden que el Presidente Santos le va a entregar el país a las FARC, piensen en las últimas palabras o en los últimos silencios expresados por el resto de las 220.000 víctimas de nuestros odios unos segundos antes de ser asesinados por sicarios: ¡Ey loco, no dispares!',
    'En todo caso y para no caer en fábulas quijotescas o en colombianadas atestadas de ironías, “no se trata sólo de apretar el gatillo, se trata de acompañar al asesino con nuestro silencio y al instigador con nuestro voto” (Villamizar, 2016).',
    'Por otra parte, ya es hora que asumamos parte del problema por el cual asesinaron a tantos colombianos sin importar el lado del espectro ideológico en el que militaban. Todos debemos desmovilizar los odios de clase, los intereses personales y los privilegios colonialistas que algunos creen merecer.',
    'El viernes 17 de septiembre de 2004, el profesor Alfredo Correa de Andreís iba caminando en compañía de su escolta Edelberto Ochoa Martínez por la carrera 53 con calle 60 en Barranquilla. A las 2 y 20 de la tarde, apareció un sicario en la vía pública y los asesinó. Primero ejecutó a su guardaespaldas. Antes de que acabara con su vida, el profesor Correa de Andreís le dijo al hombre que empuñaba el arma: “¡Ey, loco, no dispares!”, según testificaron las personas que presenciaron los homicidios. Al docente, pese a su súplica, le disparó dos veces.',
    'Por esa y por muchas más razones, jovencita, no firmo su planilla…',
    'Estoy seguro que no me escuchó. Va a llover, el parqueadero está a 2 cuadras. Él que viene, él que va, él que saluda, él que vende aguacates, la fémina sonriente y agraciada que ofrece minutos seguramente testificaran con su firma en la planilla el tipo de país que los violentos sueñan.',
    'Los dos disparos pueden ser para cualquiera.',
  ],
};

/**
 * Estado de una reunión a partir de su hora. Se calcula en el navegador y no en
 * el servidor porque depende del momento en que se mira la página: una reunión
 * "en curso" deja de estarlo sola, sin que nadie tenga que editar nada.
 */
export function meetingState(session, now = Date.now()) {
  if (!session?.scheduledAt) return 'abierto';

  const start = new Date(session.scheduledAt).getTime();
  if (Number.isNaN(start)) return 'abierto';

  const end = start + (session.duration || 90) * 60 * 1000;

  if (now < start) return 'proximo';
  if (now <= end) return 'en_curso';
  return 'finalizado';
}

export const MEETING_STATE_LABELS = {
  proximo: 'Próximo encuentro',
  en_curso: 'En curso ahora',
  finalizado: 'Encuentro finalizado',
  abierto: 'Conversación abierta',
};
