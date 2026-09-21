// Genera Excel sin librerias: un .xlsx es un zip con unos XML adentro, y lo
// armamos a mano. Evita sumar 400 KB de SheetJS para tres documentos.
//
// La OT y el acta de entrega son el mismo documento con distinto cierre, asi
// que comparten todo menos la cabecera de la tabla y el pie.
window.lynxExcel = (function () {

    function esc(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
            // Los caracteres de control rompen el XML y Excel se niega a abrir.
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
    }

    function letra(n) {
        let s = "";
        n++;
        while (n > 0) {
            const r = (n - 1) % 26;
            s = String.fromCharCode(65 + r) + s;
            n = Math.floor((n - 1) / 26);
        }
        return s;
    }

    /** Una celda. Numero si es numero, texto en linea si no. */
    function celda(col, fila, valor, estilo) {
        const ref = letra(col) + fila;
        const s = estilo ? ` s="${estilo}"` : "";
        if (valor === null || valor === undefined || valor === "") {
            return "";
        }
        if (typeof valor === "number" && isFinite(valor)) {
            return `<c r="${ref}"${s}><v>${valor}</v></c>`;
        }
        return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(valor)}</t></is></c>`;
    }

    function hoja(nombre, filas, anchos) {
        let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
        if (anchos && anchos.length) {
            xml += "<cols>";
            anchos.forEach((a, i) => {
                xml += `<col min="${i + 1}" max="${i + 1}" width="${a}" customWidth="1"/>`;
            });
            xml += "</cols>";
        }
        xml += "<sheetData>";
        filas.forEach((celdas, i) => {
            const n = i + 1;
            const cuerpo = celdas.map((v, c) => celda(c, n, v && v.v !== undefined ? v.v : v,
                v && v.s !== undefined ? v.s : null)).join("");
            if (cuerpo) xml += `<row r="${n}">${cuerpo}</row>`;
        });
        xml += "</sheetData></worksheet>";
        return xml;
    }

    // Estilos: 0 normal, 1 negrita, 2 titulo, 3 encabezado de tabla con fondo,
    // 4 texto que envuelve, 5 numero con dos decimales.
    const ESTILOS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        + '<numFmts count="1"><numFmt numFmtId="164" formatCode="0.00"/></numFmts>'
        + '<fonts count="4">'
        + '<font><sz val="10"/><name val="Calibri"/></font>'
        + '<font><b/><sz val="10"/><name val="Calibri"/></font>'
        + '<font><b/><sz val="16"/><name val="Calibri"/></font>'
        + '<font><b/><sz val="9"/><name val="Calibri"/></font>'
        + '</fonts>'
        + '<fills count="3">'
        + '<fill><patternFill patternType="none"/></fill>'
        + '<fill><patternFill patternType="gray125"/></fill>'
        + '<fill><patternFill patternType="solid"><fgColor rgb="FFF0EEED"/><bgColor indexed="64"/></patternFill></fill>'
        + '</fills>'
        + '<borders count="2"><border/>'
        + '<border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/></border>'
        + '</borders>'
        + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        + '<cellXfs count="6">'
        + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
        + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>'
        + '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0"/>'
        + '<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>'
        + '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">'
        + '<alignment vertical="top" wrapText="1"/></xf>'
        + '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>'
        + '</cellXfs>'
        + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        + '</styleSheet>';

    // ---- zip sin comprimir (stored). Excel lo acepta igual. ----

    const TABLA_CRC = (function () {
        const t = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            t[n] = c >>> 0;
        }
        return t;
    })();

    function crc32(bytes) {
        let c = 0xFFFFFFFF;
        for (let i = 0; i < bytes.length; i++) c = TABLA_CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
        return (c ^ 0xFFFFFFFF) >>> 0;
    }

    function zip(archivos) {
        const cod = new TextEncoder();
        const partes = [];
        const central = [];
        let offset = 0;

        function u16(n) { return [n & 0xFF, (n >>> 8) & 0xFF]; }
        function u32(n) { return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]; }

        for (const a of archivos) {
            const nombre = cod.encode(a.nombre);
            const datos = cod.encode(a.texto);
            const crc = crc32(datos);

            const local = [].concat(
                u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
                u32(crc), u32(datos.length), u32(datos.length),
                u16(nombre.length), u16(0));
            partes.push(new Uint8Array(local), nombre, datos);

            central.push([].concat(
                u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
                u32(crc), u32(datos.length), u32(datos.length),
                u16(nombre.length), u16(0), u16(0), u16(0), u16(0), u32(0),
                u32(offset)));
            central.push(nombre);
            offset += local.length + nombre.length + datos.length;
        }

        const dir = [];
        let largoDir = 0;
        for (const c of central) {
            const b = Array.isArray(c) ? new Uint8Array(c) : c;
            dir.push(b);
            largoDir += b.length;
        }
        dir.push(new Uint8Array([].concat(
            u32(0x06054b50), u16(0), u16(0),
            u16(archivos.length), u16(archivos.length),
            u32(largoDir), u32(offset), u16(0))));

        return new Blob(partes.concat(dir), {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
    }

    function libro(nombreHoja, xmlHoja) {
        return [
            {
                nombre: "[Content_Types].xml",
                texto: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                    + '<Default Extension="xml" ContentType="application/xml"/>'
                    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                    + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
                    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
                    + '</Types>'
            },
            {
                nombre: "_rels/.rels",
                texto: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
                    + '</Relationships>'
            },
            {
                nombre: "xl/workbook.xml",
                texto: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                    + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
                    + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
                    + `<sheets><sheet name="${esc(nombreHoja)}" sheetId="1" r:id="rId1"/></sheets></workbook>`
            },
            {
                nombre: "xl/_rels/workbook.xml.rels",
                texto: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
                    + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
                    + '</Relationships>'
            },
            { nombre: "xl/styles.xml", texto: ESTILOS },
            { nombre: "xl/worksheets/sheet1.xml", texto: xmlHoja }
        ];
    }

    function bajar(blob, archivo) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = archivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    }

    /**
     * Arma la OT o el acta. Las dos comparten cabecera y conceptos; cambian el
     * titulo, las columnas de la tabla y el pie.
     */
    function documento(d) {
        const acta = d.tipo === "acta";
        const f = [];

        f.push([null, { v: acta ? "ACTA DE ENTREGA" : "ORDEN DE TRABAJO", s: 2 },
                { v: d.numero || "", s: 2 }]);
        f.push([]);
        f.push([null, null, { v: "fecha " + (d.fecha || ""), s: 1 }]);
        f.push([]);
        f.push([{ v: "OP:", s: 1 }, d.op || ""]);
        f.push([{ v: "CLIENTE:", s: 1 }, d.cliente || ""]);
        f.push([{ v: "CONTACTO:", s: 1 }, d.contacto || ""]);
        f.push([{ v: "TELEFONO:", s: 1 }, d.telefono || ""]);
        f.push([{ v: "OBRA:", s: 1 }, d.obra || ""]);
        f.push([]);

        if (acta) {
            f.push([{ v: "HACEMOS CONSTAR EN EL ACTO QUE CON ESTA FECHA SE HACE ENTREGA A ENTERA SATISFACCION, LA INSTALACION DE:", s: 1 },
                    null, null, { v: "Observaciones", s: 3 }]);
            for (const p of d.partidas) {
                f.push([{ v: p.cantidad, s: 5 }, { v: p.concepto, s: 4 }, null, { v: "", s: 4 }]);
            }
        } else {
            f.push([{ v: "CANTIDAD", s: 3 }, { v: "CONCEPTO:", s: 3 },
                    { v: "M2 Requeridos", s: 3 }, { v: "Observaciones", s: 3 }]);
            for (const p of d.partidas) {
                f.push([{ v: p.cantidad, s: 5 }, { v: p.concepto, s: 4 },
                        { v: p.m2, s: 5 }, { v: "", s: 4 }]);
            }
            f.push([]);
            f.push([{ v: "TOTAL M2", s: 1 }, null, { v: d.m2Totales, s: 5 }]);
            f.push([{ v: "PLACAS", s: 1 }, null, { v: d.placas, s: 5 }]);
        }

        f.push([]);
        if (acta) {
            f.push([{ v: "HABIENDO CUBIERTO LAS ESPECTATIVAS QUE SE TENIAN, QUEDANDO ESTABLECIDO QUE EL CUIDADO Y MANTENIMIENTO SON RESPONSABILIDAD DEL CLIENTE.", s: 0 }]);
            f.push([]);
            f.push([{ v: "OBSERVACIONES:", s: 1 }]);
            f.push([]); f.push([]); f.push([]);
            f.push([{ v: (d.lugar || "GUADALAJARA, JALISCO") + " A ________ DE _________________ DE 20________.", s: 0 }]);
            f.push([]); f.push([]);
            f.push([{ v: "__________________________", s: 0 }, null,
                    { v: "__________________________", s: 0 }]);
            f.push([{ v: "NOMBRE Y FIRMA DEL CLIENTE", s: 1 }, null,
                    { v: "NOMBRE Y FIRMA DEL INSTALADOR", s: 1 }]);
        } else {
            f.push([{ v: "UBICACION DE OBRA:", s: 1 }, d.ubicacion || ""]);
            f.push([]);
            f.push([{ v: "VENDEDOR:", s: 1 }, d.vendedor || ""]);
            if (d.tiempoEntrega) f.push([{ v: "TIEMPO DE ENTREGA:", s: 1 }, d.tiempoEntrega]);
        }

        const nombre = acta ? "ACTA" : "OT";
        const xml = hoja(nombre, f, [16, 80, 14, 26]);
        return { blob: zip(libro(nombre, xml)), archivo: d.archivo };
    }

    return {
        generar: function (json) {
            try {
                const d = JSON.parse(json);
                const r = documento(d);
                bajar(r.blob, r.archivo);
                return true;
            } catch (e) {
                console.error("lynxExcel", e);
                return false;
            }
        }
    };
})();
