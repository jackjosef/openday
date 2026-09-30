/**
 * OPEN DAY – C.E.P. Nuestra Señora de Fátima
 * Recibe los pre-registros de la página web y los guarda en esta Hoja de cálculo.
 *
 * Pegue este código en: Hoja de cálculo > Extensiones > Apps Script
 * Luego ejecute UNA VEZ la función "configurarHoja" y publique como Aplicación web.
 */

// ===================== CONFIGURACIÓN =====================
const HOJA = 'Registros';                          // Nombre de la pestaña
const NOTIFICAR_A = 'admision@nsfatima.edu.pe';    // Recibe un aviso por cada registro ('' = no avisar)
const ENVIAR_CONFIRMACION = true;                  // Enviar correo de confirmación a la familia
const EVENTO = {
  nombre: 'Open Day – Admisión 2027',
  fecha:  'Sábado 10 de octubre',
  hora:   '10:00 a.m.',
  lugar:  'C.E.P. Nuestra Señora de Fátima, Iquitos',
  whatsapp: '937 423 882'
};
// =========================================================

const EVENTO_RESPUESTA_ = Session.getEffectiveUser().getEmail();
const COLUMNAS = ['Fecha de registro', 'Nombres', 'Apellidos', 'Email', 'Celular',
                  'Grado de interés', 'Año de postulación', 'Estado', 'Responsable', 'Observaciones'];
const ESTADOS = ['Pendiente', 'Contactado', 'Confirmado', 'Asistió', 'No asistió', 'Matriculado', 'Descartado'];

/** Ejecutar una sola vez: crea encabezados, formato y lista de estados. */
function configurarHoja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(HOJA) || ss.insertSheet(HOJA);
  sh.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS])
    .setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#D0101B');
  sh.setFrozenRows(1);
  sh.setColumnWidths(1, COLUMNAS.length, 150);
  sh.setColumnWidth(4, 220);
  sh.setColumnWidth(10, 280);
  sh.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
  sh.getRange('E:E').setNumberFormat('@');

  const regla = SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS, true).build();
  sh.getRange(2, 8, sh.getMaxRows() - 1, 1).setDataValidation(regla);

  // Colores según el estado
  const rango = sh.getRange(2, 1, sh.getMaxRows() - 1, COLUMNAS.length);
  const color = (texto, fondo) => SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$H2="' + texto + '"').setBackground(fondo).setRanges([rango]).build();
  sh.setConditionalFormatRules([
    color('Pendiente', '#FFF4CC'), color('Contactado', '#DCEBFF'), color('Confirmado', '#D9F2E3'),
    color('Asistió', '#B7E4C7'), color('Matriculado', '#95D5B2'),
    color('No asistió', '#F8D7DA'), color('Descartado', '#E9E9E9')
  ]);

  if (sh.getFilter() == null) sh.getRange(1, 1, sh.getMaxRows(), COLUMNAS.length).createFilter();
  crearResumen_(ss);
  ss.toast('Hoja configurada correctamente', 'Open Day', 5);
}

/** Pestaña "Resumen" con conteos automáticos. */
function crearResumen_(ss) {
  const r = ss.getSheetByName('Resumen') || ss.insertSheet('Resumen');
  r.clear();
  r.getRange('A1').setValue('Resumen Open Day').setFontSize(14).setFontWeight('bold').setFontColor('#D0101B');
  r.getRange('A3:B3').setValues([['Total de registros', '=COUNTA(Registros!B2:B)']]);
  r.getRange('A5:B5').setValues([['Estado', 'Cantidad']]).setFontWeight('bold').setBackground('#F2D675');
  ESTADOS.forEach((e, i) => r.getRange(6 + i, 1, 1, 2).setValues([[e, '=COUNTIF(Registros!H2:H,"' + e + '")']]));
  const g = 6 + ESTADOS.length + 1;
  r.getRange(g, 1, 1, 2).setValues([['Grado de interés', 'Cantidad']]).setFontWeight('bold').setBackground('#F2D675');
  r.getRange(g + 1, 1).setFormula('=IFERROR(QUERY(Registros!F2:F,"select F, count(F) where F is not null group by F label count(F) \'\'",0),"")');
  r.setColumnWidth(1, 200);
}

/** Recibe los datos del formulario web. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const p = (e && e.parameter) || {};
    if (p.website) return salida_('ok');                    // robot
    const req = ['nombres', 'apellidos', 'email', 'celular', 'grado', 'anio'];
    if (req.some(k => !String(p[k] || '').trim())) return salida_('faltan datos');

    const limpio = v => String(v || '').trim().replace(/[<>]/g, '').slice(0, 200);
    const fila = [new Date(), limpio(p.nombres), limpio(p.apellidos), limpio(p.email).toLowerCase(),
                  limpio(p.celular), limpio(p.grado), limpio(p.anio), 'Pendiente', '', ''];

    // En la hoja se antepone ' a textos que empiezan con = + - @ (evita que se lean como fórmulas)
    const filaHoja = fila.map(v => typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v);
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
    sh.appendRow(filaHoja);

    if (NOTIFICAR_A) {
      MailApp.sendEmail({
        to: NOTIFICAR_A,
        subject: 'Nuevo registro Open Day: ' + fila[1] + ' ' + fila[2] + ' (' + fila[5] + ')',
        htmlBody: '<h3 style="color:#D0101B">Nuevo pre-registro – ' + EVENTO.nombre + '</h3>' +
          '<p><b>Nombre:</b> ' + fila[1] + ' ' + fila[2] + '<br><b>Email:</b> ' + fila[3] +
          '<br><b>Celular:</b> ' + fila[4] + '<br><b>Grado:</b> ' + fila[5] + '<br><b>Postulación:</b> ' + fila[6] + '</p>' +
          '<p><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">Abrir la hoja de registros</a></p>'
      });
    }

    if (ENVIAR_CONFIRMACION && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fila[3])) {
      MailApp.sendEmail({
        to: fila[3],
        name: 'C.E.P. Nuestra Señora de Fátima',
        replyTo: NOTIFICAR_A || EVENTO_RESPUESTA_,
        subject: 'Recibimos su pre-registro – ' + EVENTO.nombre,
        htmlBody: '<div style="font-family:Arial,sans-serif;max-width:560px">' +
          '<h2 style="color:#D0101B;margin-bottom:4px">¡Gracias por su interés!</h2>' +
          '<p>Estimado(a) ' + fila[1] + ':</p>' +
          '<p>Hemos recibido su pre-registro para el <b>' + EVENTO.nombre + '</b> (' + fila[5] + ').</p>' +
          '<p style="background:#F6F2EA;border-left:4px solid #C9A227;padding:10px 14px">' +
          '<b>Fecha:</b> ' + EVENTO.fecha + '<br><b>Hora:</b> ' + EVENTO.hora + '<br><b>Lugar:</b> ' + EVENTO.lugar + '</p>' +
          '<p>Este registro no es la inscripción definitiva. Pronto nos comunicaremos con usted para continuar con el proceso.</p>' +
          '<p>Consultas por WhatsApp: ' + EVENTO.whatsapp + '</p>' +
          '<p style="color:#777;font-size:12px">C.E.P. Nuestra Señora de Fátima – Iquitos</p></div>'
      });
    }
    return salida_('ok');
  } catch (err) {
    console.error(err);
    return salida_('error');
  } finally {
    lock.releaseLock();
  }
}

/** Para comprobar que la aplicación web está activa (abrir la URL /exec en el navegador). */
function doGet() {
  return salida_('Servicio de registros Open Day activo');
}

function salida_(t) {
  return ContentService.createTextOutput(JSON.stringify({ resultado: t })).setMimeType(ContentService.MimeType.JSON);
}
