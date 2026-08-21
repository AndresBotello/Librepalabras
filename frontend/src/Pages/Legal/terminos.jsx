import React, { useContext } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { LEGAL_CONTACT_EMAIL, MIN_AGE, TERMS_UPDATED_AT, TERMS_VERSION } from '../../config/legal';

const SECTIONS = [
  {
    title: 'Qué es LiberaPalabras',
    paragraphs: [
      'LiberaPalabras es una plataforma cultural con sede en Valledupar, Cesar (Colombia), dedicada a la difusión de la literatura del Valle del César. A través de ella, los autores publican sus obras, los lectores las leen y las comentan, y la comunidad participa en concursos, encuentros del grupo focal y en la revista Poleversia.',
      'Estos términos regulan el uso de la plataforma: qué puedes hacer en ella, qué ocurre con los textos que subes y qué compromisos asumimos unos y otros. Junto con las bases particulares de cada concurso, forman el acuerdo completo entre tú y LiberaPalabras.',
    ],
  },
  {
    title: 'Aceptación',
    paragraphs: [
      'Para crear una cuenta hay que aceptar estos términos de forma expresa. No es posible registrarse sin hacerlo, y el hecho de marcar la casilla en el formulario equivale a firmar este acuerdo.',
      `Al aceptar, se guarda junto a tu cuenta la versión del texto que aceptaste (actualmente la ${TERMS_VERSION}) y la fecha en que lo hiciste. Si más adelante usas la plataforma sin tener cuenta —leyendo obras publicadas, por ejemplo—, también te aplican los apartados que no dependen del registro.`,
    ],
  },
  {
    title: 'Quién puede registrarse',
    paragraphs: [
      `Hay que tener al menos ${MIN_AGE} años cumplidos. El formulario pide la fecha de nacimiento y rechaza el registro por debajo de esa edad.`,
      `Entre los ${MIN_AGE} y los 17 años se puede participar, pero se necesita la autorización de la madre, el padre o el acudiente legal, que asume la responsabilidad sobre la cuenta y sobre lo que se publique desde ella. Al registrarte en ese rango de edad declaras contar con ese permiso.`,
      'Si detectamos una cuenta de un menor por debajo de la edad mínima, la desactivamos y borramos sus datos personales.',
    ],
  },
  {
    title: 'Tu cuenta',
    paragraphs: [
      'Al registrarte pedimos nombres, apellidos, teléfono, fecha de nacimiento y género, además del correo electrónico. Los datos deben ser verdaderos y estar al día: de ellos dependen la firma de tus obras, los avisos que te enviamos y el contacto en caso de concurso o de reclamación.',
      'La contraseña es personal e intransferible y eres responsable de lo que ocurra desde tu cuenta. Si crees que alguien ha entrado en ella, cámbiala y avísanos. También puedes entrar con Google, en cuyo caso la contraseña la gestiona Google y nosotros nunca la vemos.',
      'Una persona, una cuenta. Crear cuentas adicionales para inflar valoraciones, votos, "me gusta" o participaciones en un concurso es motivo de retirada de todas ellas.',
    ],
  },
  {
    title: 'Los distintos roles',
    paragraphs: [
      'La plataforma distingue entre usuarios lectores, colaboradores (que publican obras), jurados (que califican en los concursos) y administradores. El registro abierto da siempre el rol de usuario.',
      'Los roles de colaborador, jurado y administrador se conceden por invitación del equipo, y solo se aplican si la cuenta se crea con la dirección de correo exacta a la que se envió la invitación. Un rol puede retirarse cuando termina el encargo —un jurado tras cerrarse el concurso, por ejemplo— sin que eso afecte a las obras ya publicadas.',
    ],
  },
  {
    title: 'Tus obras siguen siendo tuyas',
    paragraphs: [
      'Publicar en LiberaPalabras no nos transfiere ningún derecho de autor. Conservas la propiedad intelectual íntegra de tus textos, y puedes publicarlos también en cualquier otro sitio, en papel o donde quieras, sin pedirnos permiso.',
      'Lo que nos concedes es una licencia no exclusiva, gratuita, para el territorio en el que la plataforma esté disponible y mientras la obra siga publicada, con un alcance limitado a lo necesario para que la plataforma funcione: alojar la obra, mostrarla a los lectores, permitir su lectura o descarga según el tipo que hayas elegido, generar vistas previas y portadas, y difundirla en las secciones de la web y en las redes de LiberaPalabras citando siempre tu autoría.',
      'Esa licencia termina cuando retiras la obra, salvo en lo ya distribuido antes de la retirada —un número de la revista ya publicado, o una copia que un lector descargó legítimamente— y en las copias técnicas de seguridad, que se eliminan en sus ciclos normales.',
    ],
  },
  {
    title: 'Lo que garantizas al publicar',
    paragraphs: [
      'Cada vez que subes una obra, una portada o cualquier archivo, declaras y garantizas que:',
    ],
    items: [
      'La obra es tuya y original, o cuentas con la autorización escrita de quien tenga los derechos.',
      'No infringe derechos de autor, marcas, ni derechos de imagen, honor o intimidad de terceros.',
      'Si la firmas con un nombre distinto al de tu cuenta —la plataforma lo permite para publicar la obra de otra persona—, tienes autorización expresa de ese autor o de sus herederos. La plataforma deja constancia interna de que la firma no coincide con la cuenta, precisamente para poder distinguir un encargo legítimo de una suplantación.',
      'Las imágenes de portada que subes son tuyas, de dominio público, o tienes licencia para usarlas.',
      'Si el texto recoge datos, testimonios o fotografías de personas reales, cuentas con su consentimiento.',
    ],
    afterParagraphs: [
      'Responderás frente a terceros por las reclamaciones derivadas del contenido que publiques. Si recibimos una reclamación fundada de plagio o de uso no autorizado, retiramos la obra mientras se aclara y te lo comunicamos al correo de tu cuenta.',
    ],
  },
  {
    title: 'Contenido que no se admite',
    paragraphs: [
      'La literatura incomoda, y eso no es un problema: un relato puede tratar la violencia, el sexo o la muerte sin que aquí nadie lo censure. Lo que no se admite es otra cosa. Queda prohibido publicar, comentar o difundir:',
    ],
    items: [
      'Material sexual que involucre a menores de edad, en cualquier forma y bajo cualquier pretexto literario.',
      'Contenido que incite al odio o a la violencia contra personas o grupos por su origen, etnia, religión, género, orientación sexual, discapacidad o ideas políticas.',
      'Amenazas, acoso, hostigamiento o campañas dirigidas contra una persona concreta.',
      'Datos personales de terceros sin su permiso: direcciones, teléfonos, documentos de identidad.',
      'Obras ajenas presentadas como propias, o fragmentos de otros autores sin cita ni autorización.',
      'Publicidad no solicitada, estafas, cadenas, o enlaces a software malicioso.',
      'Contenido que suplante la identidad de otra persona o del propio equipo de LiberaPalabras.',
    ],
  },
  {
    title: 'Revisión editorial y moderación',
    paragraphs: [
      'Las obras no se publican solas: entran con estado "pendiente de revisión" y un administrador las aprueba antes de que sean visibles. La revisión comprueba que la obra encaja en la plataforma y cumple estos términos; no es una valoración de su calidad literaria ni una verificación de su autoría, que sigue siendo responsabilidad de quien la sube.',
      'Podemos rechazar una obra, pedirte cambios, retirarla después de publicada, eliminar comentarios o desactivar una cuenta cuando haya un incumplimiento de estos términos o una orden de autoridad competente. Salvo en casos graves o urgentes, te avisaremos y podrás responder escribiendo al correo de contacto.',
      'Que una obra esté publicada no significa que la plataforma comparta lo que dice. Las opiniones de cada texto y de cada comentario son de quien los firma.',
    ],
  },
  {
    title: 'Comentarios, valoraciones y convivencia',
    paragraphs: [
      'Los lectores pueden comentar las obras, valorarlas con estrellas y marcarlas con "me gusta". El comentario es una lectura, no un ajuste de cuentas: se puede discrepar de un texto sin faltar a quien lo escribió.',
      'Cualquiera puede denunciar un comentario que considere abusivo. Las denuncias entran en una cola que revisa el equipo, y terminan con el comentario eliminado o con la denuncia descartada. El autor de una obra también puede eliminar comentarios en su propia obra.',
      'Manipular las valoraciones —con cuentas falsas, acuerdos de intercambio o votos en masa— invalida los resultados y puede costar la cuenta.',
    ],
  },
  {
    title: 'Obras de descarga de pago',
    paragraphs: [
      'Al publicar, el autor elige si su obra es de lectura libre o una descarga de pago con un precio que él mismo fija, con un mínimo de 0,99 unidades monetarias en la moneda que indique la plataforma.',
      'El autor es el vendedor y el responsable de que el archivo se corresponda con lo anunciado. Las condiciones económicas concretas —comisiones, plazos de liquidación, impuestos y medio de pago— se pactan por separado con el equipo de LiberaPalabras antes de activar la venta, y prevalecen sobre este apartado.',
      'El lector que compra una descarga adquiere una copia para su uso personal: puede leerla y conservarla, pero no revenderla ni redistribuirla. Las devoluciones de un archivo ya descargado solo proceden si el archivo está defectuoso o no corresponde a lo ofrecido.',
    ],
  },
  {
    title: 'Concursos',
    paragraphs: [
      'Cada concurso tiene sus propias bases, que se publican en su convocatoria e indican plazos, requisitos, premios y criterios de calificación. Esas bases mandan sobre este apartado en lo que se contradigan.',
      'Las obras las califica un jurado designado por la organización. Sus decisiones son motivadas y definitivas, y no dan lugar a reclamación por el sentido del fallo. Sí puede reclamarse un error material o un defecto del procedimiento, escribiendo al correo de contacto dentro de los quince días siguientes a la publicación de los resultados.',
      'Participar supone autorizar que, en caso de resultar premiado, se publique tu nombre y tu obra en la web y en la difusión del concurso. No se admiten obras que hayan sido premiadas antes en otro certamen, salvo que las bases digan lo contrario.',
    ],
  },
  {
    title: 'Grupo Focal y encuentros',
    paragraphs: [
      'El grupo focal organiza encuentros presenciales y actividades con inscripción a través de la plataforma. Al inscribirte, tus datos de contacto se usan para gestionar la asistencia y avisarte de cambios.',
      'En los encuentros suelen tomarse fotografías y vídeos para difundir la actividad. Si no quieres aparecer, dilo al equipo organizador antes o durante el evento y respetaremos tu decisión; también puedes pedir después que retiremos una imagen concreta.',
      'Una plaza reservada y no ocupada deja fuera a otra persona: si no vas a asistir, avisa con antelación.',
    ],
  },
  {
    title: 'Revista Poleversia',
    paragraphs: [
      'Poleversia es la revista de la plataforma y se publica en ediciones descargables. La selección de lo que entra en cada número corresponde a su equipo editorial.',
      'Que un texto se publique en la revista no traslada sus derechos: el autor los conserva, en los mismos términos del apartado sobre tus obras, con la particularidad de que un número ya editado y distribuido no se puede retirar de la circulación.',
    ],
  },
  {
    title: 'La marca y el contenido de la plataforma',
    paragraphs: [
      'El nombre LiberaPalabras, su logotipo, el diseño de la web, sus textos propios y su código son de la plataforma y de sus titulares. No se pueden copiar ni reutilizar sin permiso escrito.',
      'Tampoco se admite extraer masivamente el contenido de la web con robots o rastreadores, ni reproducir el catálogo de obras en otro sitio, ni usarlo para entrenar sistemas automáticos, sin autorización expresa.',
    ],
  },
  {
    title: 'Retirar una obra o cerrar tu cuenta',
    paragraphs: [
      'Puedes retirar una obra cuando quieras desde tu panel. Dejará de estar accesible al público, con las salvedades ya dichas sobre lo ya distribuido.',
      'También puedes pedir la baja de tu cuenta escribiendo al correo de contacto. Al darla de baja eliminamos tus datos personales y tus obras dejan de estar publicadas, salvo aquello que debamos conservar por una obligación legal o para dejar constancia de un concurso ya fallado.',
      'Los comentarios que hayas dejado en obras ajenas pueden mantenerse de forma anónima, para no romper el hilo de conversación de otras personas.',
    ],
  },
  {
    title: 'Tus datos personales',
    paragraphs: [
      'El tratamiento de los datos se rige por la Ley 1581 de 2012 y sus normas de desarrollo. El responsable del tratamiento es LiberaPalabras, con sede en Valledupar, Cesar.',
      'Recogemos el correo electrónico, los nombres y apellidos, el teléfono, la fecha de nacimiento y el género que indicas al registrarte; la foto y la descripción de perfil si las añades; las obras, comentarios y valoraciones que publicas; y datos técnicos de uso como la fecha del último acceso. Los usamos para identificarte, mostrar tu autoría, gestionar concursos e inscripciones, enviarte avisos de la plataforma y moderar el contenido. La base del tratamiento es tu autorización, que das al aceptar estos términos y que puedes retirar en cualquier momento.',
      `Tienes derecho a conocer, actualizar y rectificar tus datos, a pedir prueba de la autorización, a ser informado del uso que les damos, a presentar quejas ante la Superintendencia de Industria y Comercio, y a revocar la autorización o solicitar la supresión cuando no exista un deber legal de conservarlos. Para ejercerlos, escribe a ${LEGAL_CONTACT_EMAIL} desde la dirección con la que te registraste; respondemos en los plazos que fija la ley.`,
      'Los datos no se venden ni se ceden a terceros para su publicidad. Ten en cuenta, eso sí, que tu nombre de autor, tus obras publicadas, tus comentarios y tu perfil público son visibles para cualquiera que entre en la web: eso es el objeto mismo de la plataforma.',
    ],
  },
  {
    title: 'Servicios de terceros',
    paragraphs: [
      'Para funcionar nos apoyamos en proveedores externos que tratan datos por nuestra cuenta: Google Firebase gestiona la autenticación y la base de datos, y Cloudinary aloja las imágenes y los archivos PDF. Al usar la plataforma aceptas que tus datos se traten en la infraestructura de esos proveedores, que pueden estar en servidores fuera de Colombia con garantías de seguridad equivalentes.',
      'Usamos una cookie propia para mantener tu sesión iniciada. Es imprescindible para que la web funcione y no sirve para perfilarte ni para publicidad.',
    ],
  },
  {
    title: 'Disponibilidad del servicio',
    paragraphs: [
      'LiberaPalabras es un proyecto cultural y la plataforma se ofrece tal como está. Procuramos que funcione siempre, pero puede haber interrupciones por mantenimiento, fallos técnicos o causas ajenas, y podemos modificar o suspender secciones.',
      'Guarda siempre una copia propia de tus obras. Hacemos copias de seguridad, pero no podemos garantizar la recuperación de un archivo perdido, y la plataforma no sustituye a tu propio respaldo.',
    ],
  },
  {
    title: 'Responsabilidad',
    paragraphs: [
      'Respondemos de los daños que causemos por dolo o culpa grave, y de lo que la ley colombiana no permita excluir. Fuera de eso, no respondemos del contenido que publican los usuarios, de los tratos que hagan entre ellos, ni de los perjuicios derivados de un uso de la plataforma contrario a estos términos.',
      'Si un contenido tuyo provoca una reclamación de un tercero contra la plataforma, asumirás su defensa y los costes que se deriven.',
    ],
  },
  {
    title: 'Cambios en estos términos',
    paragraphs: [
      'Podemos actualizar este texto para adaptarlo a nuevas secciones de la plataforma o a cambios en la ley. Cuando el cambio sea sustancial, lo anunciaremos en la web y te pediremos que vuelvas a aceptarlo la próxima vez que entres.',
      'La versión vigente y su fecha figuran siempre al principio de esta página. Seguir usando la plataforma después de un cambio anunciado supone aceptarlo.',
    ],
  },
  {
    title: 'Ley aplicable y contacto',
    paragraphs: [
      'Este acuerdo se rige por la legislación colombiana. Para cualquier controversia, las partes se someten a los jueces de Valledupar, Cesar, sin perjuicio de los derechos que la ley reconozca al usuario como consumidor.',
      `Para cualquier duda, reclamación o solicitud sobre tus datos, escribe a ${LEGAL_CONTACT_EMAIL}.`,
    ],
  },
];

export default function Terminos() {
  const { isDark } = useContext(ThemeContext);

  const bodyText = isDark ? 'text-gray-300' : 'text-gray-700';
  const headingText = isDark ? 'text-gray-100' : 'text-brand-700';
  const mutedText = isDark ? 'text-gray-500' : 'text-gray-500';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      <Navbar />

      <main className="flex-1 w-full px-4 sm:px-6 py-10 sm:py-16">
        <article className="max-w-3xl mx-auto">
          <header className={`pb-8 mb-10 border-b ${isDark ? 'border-gray-800' : 'border-gray-300'}`}>
            <h1 className={`text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-3 ${headingText}`}>
              Términos y Condiciones
            </h1>
            <p className={`text-sm ${mutedText}`}>
              Versión {TERMS_VERSION} · Última actualización: {TERMS_UPDATED_AT}
            </p>
            <p className={`mt-4 text-base leading-relaxed ${bodyText}`}>
              Léelos con calma antes de crear tu cuenta. Explican qué puedes hacer en LiberaPalabras,
              qué ocurre con los textos que publiques y cómo tratamos tus datos.
            </p>
          </header>

          {/* Numeradas a mano desde el índice del array: si mañana se intercala
              un apartado, la numeración se recoloca sola y no queda un "7 bis"
              escrito en el texto. */}
          <div className="space-y-10">
            {SECTIONS.map((section, index) => (
              <section key={section.title} aria-labelledby={`seccion-${index + 1}`}>
                <h2
                  id={`seccion-${index + 1}`}
                  className={`text-lg sm:text-xl font-serif font-bold mb-3 ${headingText}`}
                >
                  <span className={`mr-2 tabular-nums ${mutedText}`}>{index + 1}.</span>
                  {section.title}
                </h2>

                <div className={`space-y-4 text-[15px] leading-relaxed ${bodyText}`}>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}

                  {section.items && (
                    <ul className="space-y-2 pl-1">
                      {section.items.map((item) => (
                        <li key={item.slice(0, 40)} className="flex gap-3">
                          <span aria-hidden="true" className="mt-2.5 w-1 h-1 rounded-full shrink-0 bg-current opacity-50" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.afterParagraphs?.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className={`mt-12 pt-8 border-t text-sm ${mutedText} ${isDark ? 'border-gray-800' : 'border-gray-300'}`}>
            LiberaPalabras · Valledupar, Cesar, Colombia · {LEGAL_CONTACT_EMAIL}
          </p>
        </article>
      </main>

      <Footer />
    </div>
  );
}
