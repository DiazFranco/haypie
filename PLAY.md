# Publicación en Google Play — Hay Pie Truco

Cuenta de desarrollador: **Cuyo Games** · Package / Application ID: `com.cuyogames.haypie`
Contacto de soporte: **franco.gdiaz9@gmail.com** · Política de privacidad: `PRIVACY.md` (repo público)

## Datos fijos

| Campo | Valor |
|---|---|
| Nombre en la app | Hay Pie Truco |
| Application ID | com.cuyogames.haypie |
| Categoría | Games > Card |
| Tipo | Juego, gratis |
| Email de soporte | franco.gdiaz9@gmail.com |
| Privacidad | https://raw.githubusercontent.com/DiazFranco/haypie/master/PRIVACY.md |
| Ícono Play | `store/play-icon-512.png` (512×512) |
| Feature graphic | `store/play-feature-graphic-1024x500.png` (1024×500) |

## Textos listos

**Descripción breve (máx 80 caracteres)**
```
Marcador de Truco: mesa, equipos y puntos, en vivo.
```

**Descripción completa**
```
Hay Pie Truco es la forma más simple de llevar el marcador de la partida de Truco.

• Armá tu mesa con los nombres de los jugadores y compartí el código
• Sumá puntos de a 1, 2, 3 o 4 para cada equipo
• Elegí el objetivo: 15 o 30 puntos
• Los que miran ven el marcador en vivo, sin poder sumar
• Historial y estadísticas de cada mesa
• Funciona sin conexión: si te quedás sin señal, seguís anotando
• Cancelá el último punto con un toque

Ideal para la ronda del bar, el cumple o la competencia del domingo.
```

**Data safety** (respondé exactamente así)
- Se recoge: **Nombre** (los nombres de jugadores que carga el usuario) y **Actividad de la app** (marcador de la partida).
- Para qué: **Funcionalidad de la app**.
- ¿Se comparte con el desarrollador? **Sí**. ¿Con terceros? **No**.
- Cifrado en tránsito: **Sí** (HTTPS). ¿Se puede pedir la eliminación? **Sí**, por email.
- No hay rastreadores de anuncios, ni información de compra, ni ubicación, ni contactos.

**Content rating**: cuestionario → Todo "No" en violencia, lenguaje, compras, anuncios, contenido generado por usuarios. Resultado esperado: TODOS (EVERYONE).

**App content**: sin ads, sin purchases in-app, sin login, sin app access.

## Orden de pasos en Play Console

1. **Crear app**: nombre, idioma Español, tipo *Juego*, gratis, completar declaraciones.
2. **App content** (bloquea la primera release): Data safety → Content rating → App access → Ads → Target audience.
3. **Testing → Internal testing → Create new release**:
   - Subir el AAB de producción (`build/hay-pie-truco-v1.aab` o el más reciente que generemos).
   - Play crea el certificado de *Play App Signing* en el primer upload.
4. **Testers** → agregar `franco.gdiaz9@gmail.com` (hasta 100) → copiar el **opt-in link** → abrirlo en el teléfono e instalar.
5. Probar con 2-3 personas: crear mesa, unirse desde otro teléfono como espectador, ver el marcador en vivo.
6. Cuando la app esté estable: pasar a **Production** con release gradual (5% → 20% → 100%) y la ficha con los textos de arriba.

## Qué falta antes de publicar en producción

- [ ] Capturas de pantalla (mínimo 2, formato teléfono). Se pueden sacar del emulador o del teléfono en internal testing.
- [ ] Probar el flujo de espectador con dos dispositivos reales.
- [ ] Confirmar que el AAB firmado por Play App Signing arranca bien.
- [ ] (Opcional) Dominio propio para la política; hoy usamos el raw del repo.
