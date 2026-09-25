# Carry-on

Un organizador visual de equipaje: mochila y maleta que se llenan según el peso registrado.

**Web:** https://rogerf5-security.github.io/Carry-on/

## Uso

1. Abre «Ajustar peso vacío y límite» en cada pieza y registra su peso real y el límite de tu boleto.
2. Añade un artículo, su peso por unidad, cantidad y equipaje.
3. Revisa el porcentaje, peso disponible y posibles excesos. Puedes editar, mover o eliminar artículos.
4. Cambia entre libras y kilos sin alterar el peso almacenado.
5. Guarda una copia JSON para conservar o trasladar tu lista. También puedes imprimirla.

Los valores de 20 lb y 10 lb son ejemplos configurables, no políticas de una aerolínea. El dibujo representa peso, no volumen ni dimensiones. Un peso vacío sin registrar aparece como pendiente: los totales son incompletos hasta registrarlo.

## Privacidad y funcionamiento

- HTML, CSS, JavaScript y diagramas SVG en un único `index.html`, sin dependencias ni recursos externos.
- Estado local en `localStorage` bajo `carry-on.v1`. No hay cuentas, analítica ni servidor de datos. El proveedor de alojamiento puede registrar las solicitudes de acceso a la web.
- Cada navegador/dispositivo tiene su propia lista; no hay sincronización en la nube.
- Se puede abrir el HTML descargado sin conexión. La persistencia bajo `file://` depende del navegador; conserva copias JSON.
- La importación valida estructura, límites y artículos antes de pedir confirmación. Los nombres se insertan como texto, nunca como HTML.
- Pesos almacenados en gramos; 1 lb = 453.59237 g. El peso total es tara + suma(peso unitario × cantidad). El porcentaje puede superar 100%; el dibujo se satura al 100% y se indica el exceso numérico.

## Desarrollo y publicación

Sirve la carpeta, por ejemplo con `python -m http.server 8080 --bind 127.0.0.1`, y abre http://127.0.0.1:8080.

GitHub Pages publica desde la raíz de `main`. No requiere compilación ni credenciales en el código.

### Comprobaciones

La prueba de navegador `tests/smoke.cjs` requiere Playwright instalado en el entorno de desarrollo (no en la web). Con el servidor activo: `node tests/smoke.cjs`. Cubre cálculos, conversión, persistencia, edición, traslado, exceso, importación y vista móvil.

Un proyecto de [Roger F5](https://github.com/RogerF5-Security).
