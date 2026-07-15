# Complejidad

[English](./complexity.md) · **Español**

Sea $V$ el número de RFCs (nodos) alcanzables dentro del presupuesto de profundidad y $E$ el número de aristas de facturación entre ellos.

## BFS de proximidad - tiempo $O(V + E)$, espacio $O(V)$

- Cada nodo se encola **a lo más una vez**: se agrega a `visited` en su primer descubrimiento y nunca se vuelve a agregar. Eso es $\le V$ encolados, así que $\le V$ desencolados.
- Cuando se desencola un nodo, escaneamos su conjunto de proveedores una vez. A lo largo de toda la corrida cada arista se examina un número constante de veces (una vez, desde el lado de su receptor), para un trabajo total de vecinos de $O(E)$.
- `visited`, la cola y la lista de aportes contienen cada una $O(V)$ entradas. El ordenamiento final de los aportes es $O(k \log k)$ donde $k \le V$ es el número de EFOS encontrados - dominado por $O(V)$ en la práctica ya que $k$ es pequeño.

Total: tiempo $O(V + E)$, espacio $O(V)$. El corte de profundidad solo reduce $V$ y $E$ al subgrafo alcanzable.

## DFS de carruseles - tiempo $O(V + E)$, espacio $O(V)$

DFS estándar blanco/gris/negro: cada nodo se colorea de gris una vez y de negro una vez, cada arista se sigue una vez. La pila de recursión y el mapa de colores son $O(V)$. Reportar un ciclo corta la ruta activa, cuya longitud es $\le V$.

## Huella de datos

La lista oficial 69-B tiene ~14,000 filas. Como un `Map<RFC, NodeState>` eso son unos cuantos megabytes - vive por completo en memoria, sin base de datos requerida. El parseo es una sola pasada lineal sobre el CSV, $O(\text{filas})$.

## Nota práctica

Como ambos recorridos son lineales y los grafos en cuestión (la vecindad de proveedores de un cliente, 2-3 saltos de profundidad) son pequeños, el costo real está en construir la lista de aristas aguas arriba, no en correr el motor. El motor en sí es prácticamente gratis.
