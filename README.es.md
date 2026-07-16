# efos-risk-graph

> Propagación de riesgo fiscal para la lista negra del **Art. 69-B** del SAT (EFOS/EDOS), razonada desde las matemáticas.

[![npm version](https://img.shields.io/npm/v/efos-risk-graph.svg?color=black)](https://www.npmjs.com/package/efos-risk-graph)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-black.svg)](https://www.typescriptlang.org/)

[English](./README.md) · **Español**

```bash
pnpm add efos-risk-graph
```

El SAT publica una lista de ~14,000 contribuyentes presuntos o confirmados de emitir facturas simuladas (**EFOS**). Verificar si *tu* proveedor está en esa lista es fácil - una simple consulta. La pregunta que de verdad protege una deducción es más difícil:

> **¿A cuántos saltos estoy de un EFOS?**

Tu proveedor directo puede estar limpio, pero *su* proveedor puede ser un EFOS confirmado. Este paquete responde eso tratando la facturación como un grafo dirigido y propagando el riesgo de lista negra a través de él, atenuado por la distancia.

El objetivo aquí no es solo el puntaje, sino **entender por qué es ese el puntaje** - así que cada decisión de diseño de abajo se deriva, y luego se verifica contra un grafo lo bastante pequeño para revisarlo a mano.

## La idea

- Un **nodo** es un RFC. Una **arista** dirigida `A -> B` significa "A le facturó a B" (A es el emisor, B el receptor de un CFDI).
- La lista 69-B no te da aristas - te da una **propiedad de algunos nodos**: su `situacion` (Presunto / Definitivo / Desvirtuado / Sentencia Favorable), que se convierte en un peso base de riesgo.
- El riesgo fluye *a lo largo* de las aristas de facturación y **decae por un factor `alpha` en cada salto**. Un EFOS confirmado a un salto es un problema real; a cinco saltos es ruido.

Esta separación es todo el punto: **el motor es de código abierto, las aristas son privadas.** El motor de grafos y el parser de la 69-B aquí no saben nada de dónde vienen las aristas. Dentro de un producto real, las aristas se derivan de los CFDIs confidenciales de los clientes y nunca tocan este repositorio - un modelo open-core.

## Enfoque - resolverlo a mano

### 1. El riesgo como distancia atenuada

Dale a cada RFC un peso base `w(rfc) in [0, 1]` según su situación 69-B (Definitivo $=1$, Presunto $=0.6$, Desvirtuado $=0.05$, en otro caso $0$). Para un cliente en la raíz, un EFOS encontrado $d$ saltos arriba (por la dirección de *proveedores*) aporta

$$\text{score} = w(\text{rfc}) \cdot \alpha^{\,d}, \qquad 0 < \alpha < 1.$$

El riesgo total de la raíz es el aporte **máximo**, no la suma:

$$\text{riesgo}(\text{root}) = \max_{\text{efos } e \text{ alcanzable}} \; w(e)\cdot \alpha^{\,d(e)}.$$

**Por qué el máximo y no la suma.** Un máximo es un *cuello de botella*: el riesgo es tu peor cadena individual, y viene con una única ruta que lo explica - "tu exposición es `Cliente -> A -> D (definitivo)`." Una suma mezcla muchas señales débiles en un número que nadie puede defender ante un auditor, y crece con el tamaño del grafo en lugar de con el peligro real.

### 2. Por qué la ruta más corta es la única que importa

Para un nodo EFOS fijo $e$, su aporte $w(e)\cdot\alpha^{d}$ es **estrictamente decreciente en $d$** (ya que $0<\alpha<1$). Así que entre todas las rutas de la raíz a $e$, el mayor puntaje siempre se alcanza en la **más corta**. La búsqueda en anchura (BFS) visita cada nodo primero por su ruta más corta - así que un BFS simple, registrando cada nodo la primera vez que se ve, ya es óptimo. Sin enumerar rutas, sin revisitar. (Argumento completo: [`docs/math/bfs-correctness.es.md`](./docs/math/bfs-correctness.es.md).)

### 3. Por qué puedes detenerte en 2-3 niveles

El peor aporte posible de la profundidad $d$ en adelante está acotado (con todos los pesos $\le 1$) por la cola de una serie geométrica:

$$\sum_{k=d+1}^{\infty} \alpha^{k} = \frac{\alpha^{\,d+1}}{1-\alpha}.$$

Con $\alpha = 0.5$, todo más allá de la profundidad 3 se acota en $\dfrac{0.5^{4}}{0.5} = 0.125$, y más allá de la profundidad 4 en $0.0625$. La serie **converge**, así que el riesgo lejano se desvanece por sí solo y truncar el BFS en `maxDepth = 2` o `3` no es un truco - es una aproximación cuantificada con una cota de error conocida. (Derivación: [`docs/math/geometric-convergence.es.md`](./docs/math/geometric-convergence.es.md).)

### 4. Los carruseles son ciclos

Un *carrusel* de facturación simulada - `A -> B -> C -> A` - es exactamente un ciclo dirigido en el grafo de facturación. Una búsqueda en profundidad (DFS) que colorea los nodos de blanco/gris/negro marca un carrusel en el momento en que encuentra una arista de retroceso hacia un nodo gris (en la pila). Ver [`src/cycles/carousel.ts`](./src/cycles/carousel.ts).

## Verificación con código

```ts
import { buildGraph, analyzeProximity, detectCarousels } from 'efos-risk-graph';

// Un cliente, MI-CLIENTE, con tres proveedores directos. Las aristas vienen
// de TUS datos (CFDIs) - `de` le facturó a `a`. El motor nunca las obtiene.
const graph = buildGraph([
  { de: 'PROV-LIMPIO01', a: 'MI-CLIENTE01' },  // proveedor limpio
  { de: 'PROV-DESVIR01', a: 'MI-CLIENTE01' },  // proveedor directo, pero ya aclarado (Desvirtuado)
  { de: 'PROV-INTERM01', a: 'MI-CLIENTE01' },  // se ve limpio él mismo...
  { de: 'EFOS-DEFINI01', a: 'PROV-INTERM01' }, // ...pero SU proveedor es un EFOS confirmado (Definitivo)
]);

// weightOf se inyecta: regresa un peso base en [0,1] para cualquier RFC.
// Definitivo = 1.0, Desvirtuado = 0.05, el resto 0.
const situacion: Record<string, number> = {
  'EFOS-DEFINI01': 1.0,
  'PROV-DESVIR01': 0.05,
};
const weightOf = (rfc: string) => situacion[rfc] ?? 0;

const r = analyzeProximity(graph, 'MI-CLIENTE01', weightOf, { alpha: 0.5, maxDepth: 3 });

// Cada proveedor directo se ve bien, pero la exposición real está a dos saltos:
console.log(r.score); // 0.25  ->  1.0 * 0.5^2, el Definitivo detrás del intermediario limpio
console.log(r.contributions[0].camino);
// ['MI-CLIENTE01', 'PROV-INTERM01', 'EFOS-DEFINI01']  <- la cadena que explica el score
console.log(detectCarousels(graph)); // []  (aquí no hay ciclo de facturación)
```

El score es la **peor cadena individual** (un cuello de botella, no una suma), y siempre regresa con la ruta que lo justifica - que es lo que le muestras a un auditor.

Corre la red sintética incluida (20 RFCs ficticios) y la suite completa:

```bash
pnpm install
pnpm test
```

## Comprobación sobre el ejemplo resuelto

El grafo de demostración ([`src/demo/synthetic.ts`](./src/demo/synthetic.ts)) esconde cuatro EFOS Definitivo a profundidad creciente detrás de `CLI010101AA1`, más un proveedor directo Presunto y uno Desvirtuado. Con $\alpha = 0.5$, `maxDepth = 3`, los aportes son potencias puras de un medio:

| EFOS         | situacion   | $d$ | $w\cdot\alpha^{d}$          | score |
|--------------|-------------|-----|-----------------------------|-------|
| EFO010101AA1 | Definitivo  | 1   | $1.0 \cdot 0.5$             | 0.5   |
| PRE010101AA1 | Presunto    | 1   | $0.6 \cdot 0.5$             | 0.3   |
| EFO020202AA1 | Definitivo  | 2   | $1.0 \cdot 0.5^2$           | 0.25  |
| EFO030303AA1 | Definitivo  | 3   | $1.0 \cdot 0.5^3$           | 0.125 |
| DES010101AA1 | Desvirtuado | 1   | $0.05 \cdot 0.5$            | 0.025 |

Entonces $\text{riesgo}(\text{CLIENTE}) = \max = \boxed{0.5}$, del Definitivo directo. Un cuarto Definitivo está a **cuatro** saltos y queda correctamente excluido por el corte de profundidad. El carrusel `CAR01 -> CAR02 -> CAR03 -> CAR01` es el único ciclo detectado. Cada uno de estos números se verifica en [`test/propagate.test.ts`](./test/propagate.test.ts).

## Trae tus propias aristas

El motor es deliberadamente incompleto: nunca aprende las aristas por su cuenta. Para integrarlo en cualquier sistema fiscal, tú aportas las dos cosas que se niega a poseer - las **aristas de facturación** (de tus datos) y el **resolvedor de pesos** (de tu copia de la lista 69-B):

```ts
import { buildGraph, analyzeProximity, parseLista69B, weightResolverFrom } from 'efos-risk-graph';

// 1. Aristas: deriva pares `emisor -> receptor` de tus propios CFDIs.
//    Esta es la mitad privada - se queda dentro de tu sistema, nunca aquí.
const edges = miFuenteDeCFDIs().map((cfdi) => ({ de: cfdi.rfcEmisor, a: cfdi.rfcReceptor }));
const graph = buildGraph(edges);

// 2. Pesos: construye un resolvedor desde el CSV oficial 69-B,
//    o inyecta el tuyo si ya guardas la lista en una base de datos.
const weightOf = weightResolverFrom(parseLista69B(csv69bText));

// 3. Evalúa cualquier cliente. El resultado es un número más la cadena que lo explica.
const { score, contributions } = analyzeProximity(graph, 'RFC-DEL-CLIENTE', weightOf);
```

Esta es toda la costura del open-core: **el motor y el parser de 69-B son públicos; de dónde vienen tus aristas es privado y nunca toca este paquete.** Un producto con su propio almacén de 69-B simplemente inyecta `weightOf` directamente y se salta el parser.

## Estructura del repositorio

```
src/
  parser/lista-69b.ts   parsea el CSV oficial de la 69-B -> Map<RFC, NodeState>
  risk/weights.ts       situacion -> peso base (normalizado 0..1)
  graph/adjacency.ts    RiskGraph: aristas de facturación, ambas direcciones indexadas
  risk/propagate.ts     analyzeProximity: BFS de ruta máxima atenuada
  cycles/carousel.ts    detectCarousels: detección de ciclos por DFS
  demo/synthetic.ts     red ficticia de 20 RFCs + verdad calculada a mano
docs/math/              los desarrollos detrás de cada decisión
test/                   las comprobaciones como aserciones ejecutables
```

## API

- `buildGraph(edges)` / `new RiskGraph().addEdge(de, a)` - construye el grafo de facturación.
- `analyzeProximity(graph, rootRfc, weightOf, { alpha?, maxDepth? })` - `{ score, contributions[] }`, cada aporte lleva su `distancia`, su `score` y el `camino` que lo explica.
- `detectCarousels(graph)` - los ciclos de facturación distintos.
- `parseLista69B(csv)` + `weightResolverFrom(list)` - construye un `weightOf` a partir del CSV oficial (para uso independiente; un producto con su propio almacén 69-B inyecta `weightOf` directamente).

## Notas

- La **complejidad** es $O(V + E)$ tanto para el BFS como para el DFS - cada nodo y arista se toca un número constante de veces ([`docs/math/complexity.es.md`](./docs/math/complexity.es.md)). Con ~14,000 nodos listados, la lista cabe en memoria sin base de datos.
- Las proporciones de peso base reflejan la banda `BLACKLIST` del motor compuesto de riesgo fiscal al que alimentan, así que el puntaje del grafo y el puntaje compuesto nunca se contradicen.
- El motor es **agnóstico a las aristas y libre de efectos secundarios**: sin E/S, sin red, sin conocimiento de los CFDIs. Eso es lo que lo hace seguro para liberar como código abierto.

## Licencia

MIT.
