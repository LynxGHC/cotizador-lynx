window.lynxPdf = (function () {
    const M = { izq: 15, der: 15, arriba: 14, abajo: 14 };
    const ANCHO = 215.9;
    const ALTO = 279.4;
    const COL = { cant: 15, desc: 26, pu: 150, pt: 178 };
    const FIN = ANCHO - M.der;

    function dinero(n) {
        return (Math.round((Number(n) || 0) * 100) / 100)
            .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    const LYNX = "data:image/png;base64,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";
    const LYNX_PROPORCION = 153 / 74;

    function marcaLynx(doc, derecha, y) {
        const alto = 13;
        const ancho = alto * LYNX_PROPORCION;
        try {
            doc.addImage(LYNX, "PNG", derecha - ancho, y - 8.5, ancho, alto);
            return ancho + 6;
        } catch (e) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.setTextColor(20, 20, 20);
            doc.text("LYNX", derecha, y, { align: "right" });
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.4);
            doc.text("SOLID SURFACING", derecha, y + 4.6, { align: "right" });
            doc.setTextColor(32, 30, 29);
            return 28;
        }
    }

    function logoDistribuidor(doc, derecha, y, logo) {
        if (!logo) return 0;
        try {
            const info = doc.getImageProperties(logo);
            const alto = 12;
            const ancho = Math.min(info.width / info.height * alto, 46);
            doc.addImage(logo, info.fileType || "PNG", derecha - ancho, y - 8.5, ancho, alto);
            return ancho + 6;
        } catch (e) {
            return 0;
        }
    }

    function rotulo(doc, y, d) {
        const usado = marcaLynx(doc, FIN, y);
        logoDistribuidor(doc, FIN - usado - 4, y, d.logoDistribuidor);
        return y;
    }

    function encabezado(doc, d) {
        let y = M.arriba + 6;
        rotulo(doc, y, d);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(d.lugar + ", a " + d.fecha, M.izq, y);

        y += 12;
        doc.setFontSize(8);
        doc.text("Vigencia de la presente cotizacion " + d.vigenciaDias + " dias.", FIN, y, { align: "right" });
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("N° COT   " + d.folio + (d.revision || ""), FIN, y, { align: "right" });

        y += 9;
        doc.setFontSize(9);
        const filas = [["Cliente:", d.cliente], ["Contacto:", d.contacto], ["Obra:", d.obra]];
        for (const [etiqueta, valor] of filas) {
            if (!valor) continue;
            doc.setFont("helvetica", "bold");
            doc.text(etiqueta, M.izq, y);
            doc.setFont("helvetica", "normal");
            doc.text(String(valor), M.izq + 22, y);
            y += 5;
        }

        y += 4;
        doc.setFontSize(8.5);
        const saludo = "Estimado(a) " + (d.contacto || d.cliente) +
            ", atendiendo a su amable solicitud, le presentamos la siguiente cotizacion:";
        const lineas = doc.splitTextToSize(saludo, FIN - M.izq);
        doc.text(lineas, M.izq, y);
        y += lineas.length * 4 + 4;
        return y;
    }

    function cabeceraTabla(doc, y) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setFillColor(240, 238, 237);
        doc.rect(M.izq, y - 4, FIN - M.izq, 6, "F");
        doc.text("cant", COL.cant, y, { align: "right" });
        doc.text("descripcion", COL.desc, y);
        doc.text("pu", COL.pu + 20, y, { align: "right" });
        doc.text("pt", COL.pt + 22, y, { align: "right" });
        doc.setFont("helvetica", "normal");
        return y + 6;
    }

    function pie(doc, pagina, total) {
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 130);
        doc.text("Pagina " + pagina + " de " + total, ANCHO / 2, ALTO - 8, { align: "center" });
        doc.setTextColor(32, 30, 29);
    }

    function partidas(doc, y, d) {
        doc.setFontSize(7.5);
        for (const p of d.partidas) {
            const lineas = doc.splitTextToSize(p.descripcion || "", COL.pu - COL.desc - 4);
            const alto = Math.max(lineas.length * 3.2, 5) + 2.5;
            if (y + alto > ALTO - M.abajo - 12) {
                doc.addPage();
                y = M.arriba + 6;
                y = cabeceraTabla(doc, y);
                doc.setFontSize(7.5);
            }
            doc.text(String(p.cantidad), COL.cant, y, { align: "right" });
            doc.text(lineas, COL.desc, y);
            doc.text(dinero(p.pu), COL.pu + 20, y, { align: "right" });
            doc.text(dinero(p.total), COL.pt + 22, y, { align: "right" });
            y += alto;
            doc.setDrawColor(226, 222, 219);
            doc.line(M.izq, y - 2, FIN, y - 2);
        }
        return y;
    }

    function renglon(doc, y, etiqueta, valor, opciones) {
        const o = opciones || {};
        doc.setFont("helvetica", o.fuerte ? "bold" : "normal");
        doc.setFontSize(o.fuerte ? 9 : 8);
        if (o.prefijo) {
            doc.setFont("helvetica", "bold");
            doc.text(o.prefijo, COL.pu - 32, y, { align: "right" });
            doc.setFont("helvetica", o.fuerte ? "bold" : "normal");
        }
        doc.text(etiqueta, COL.pu + 20, y, { align: "right" });
        doc.text(valor, COL.pt + 22, y, { align: "right" });
        return y + (o.fuerte ? 6 : 4.6);
    }

    function totales(doc, y, d) {
        if (y > ALTO - M.abajo - 70) {
            doc.addPage();
            y = M.arriba + 6;
        }
        y += 3;
        y = renglon(doc, y, "subtotal", dinero(d.subtotal));
        if (d.conDescuento) {
            for (const s of d.descuentos) {
                const pct = (Number(s.porcentaje) * 100).toFixed(2).replace(/\.00$/, "");
                y = renglon(doc, y, s.concepto + " " + pct + " %", dinero(s.importe));
                y = renglon(doc, y, "subtotal", dinero(s.subtotal));
            }
        }
        y = renglon(doc, y, "IVA", dinero(d.iva));
        y = renglon(doc, y, "Total", dinero(d.totalUsd), { fuerte: true, prefijo: "Dolares" });

        if (Number(d.tipoCambio) > 0) {
            y = renglon(doc, y, "Tipo de cambio del dia " + d.fechaTipoCambio, Number(d.tipoCambio).toFixed(4));
            y = renglon(doc, y, "Total en Pesos MX", dinero(d.totalMxn));
            if (Number(d.fleteMxn) > 0) {
                y = renglon(doc, y, "Flete y viaticos con IVA", dinero(d.fleteConIva));
            }
            y = renglon(doc, y, "Gran total en Pesos", dinero(d.granTotalMxn), { fuerte: true });
        }

        y += 4;
        if (Number(d.fleteMxn) > 0) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            const t = "Flete y viaticos a " + (d.fleteDescripcion || "definir") + ".";
            doc.text(t, M.izq, y);
            doc.text(dinero(d.fleteMxn) + "  M.N. + IVA", FIN, y, { align: "right" });
            y += 6;
        }
        return y;
    }

    function condiciones(doc, y, d) {
        const necesario = d.condiciones.length * 3.6 + 34;
        if (y + necesario > ALTO - M.abajo) {
            doc.addPage();
            y = M.arriba + 6;
        }
        y += 4;
        doc.setFontSize(7);
        doc.setTextColor(70, 70, 70);
        for (const c of d.condiciones) {
            const lineas = doc.splitTextToSize(c, FIN - M.izq);
            doc.text(lineas, M.izq, y);
            y += lineas.length * 3.1 + 0.6;
        }
        doc.setTextColor(32, 30, 29);
        y += 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("Tiempo de entrega", M.izq, y);
        doc.setFont("helvetica", "normal");
        doc.text(d.tiempoEntrega || "", COL.pt + 22, y, { align: "right" });
        y += 9;

        doc.setFontSize(8);
        doc.text("Atentamente", M.izq, y);
        y += 8;
        doc.setFont("helvetica", "bold");
        doc.text(d.vendedor.nombre || "", M.izq, y);
        doc.setFont("helvetica", "normal");
        y += 4;
        for (const linea of [d.vendedor.puesto, d.empresa, d.vendedor.telefono, d.vendedor.email, d.sitio]) {
            if (!linea) continue;
            doc.setFontSize(7.5);
            doc.text(String(linea), M.izq, y);
            y += 3.6;
        }
        return y;
    }

    function armar(d) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: "mm", format: "letter" });

        let y = encabezado(doc, d);
        y = cabeceraTabla(doc, y);
        y = partidas(doc, y, d);
        y = totales(doc, y, d);
        condiciones(doc, y, d);

        const paginas = doc.getNumberOfPages();
        for (let i = 1; i <= paginas; i++) {
            doc.setPage(i);
            pie(doc, i, paginas);
        }
        return doc;
    }

    return {
        generar: function (json) {
            const d = typeof json === "string" ? JSON.parse(json) : json;
            armar(d).save(d.archivo);
            return true;
        },
        uri: function (json) {
            const d = typeof json === "string" ? JSON.parse(json) : json;
            return armar(d).output("datauristring");
        },
        datos: function (json) {
            const d = typeof json === "string" ? JSON.parse(json) : json;
            const doc = armar(d);
            return JSON.stringify({ paginas: doc.getNumberOfPages(), uri: doc.output("datauristring").length });
        }
    };
})();
