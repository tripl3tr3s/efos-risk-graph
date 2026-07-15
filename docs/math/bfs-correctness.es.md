# Corrección de la propagación por BFS

[English](./bfs-correctness.md) · **Español**

Afirmamos que una sola búsqueda en anchura, registrando cada nodo la primera vez que se descubre, calcula el riesgo máximo atenuado exacto para cada EFOS alcanzable.

## Planteamiento

Sea la raíz $r$. Recorremos la dirección de **proveedores**: `proveedores(u)` es el conjunto de RFCs que le facturaron a $u$. Para un nodo $e$ sea $d(e)$ su distancia de ruta más corta desde $r$ en esa dirección, y $w(e) \in [0,1]$ su peso base. Fijamos $\alpha \in (0,1)$. Definimos el aporte de un EFOS $e$ alcanzado por una ruta de longitud $\ell$ como

$$c(e, \ell) = w(e)\cdot \alpha^{\ell}.$$

El motor reporta, por EFOS, el único valor $w(e)\cdot\alpha^{d(e)}$, y para la raíz $\max_e w(e)\cdot\alpha^{d(e)}$.

## Afirmación 1 - la mejor ruta es la ruta más corta

Para un $e$ fijo, $c(e,\ell) = w(e)\cdot\alpha^{\ell}$ es estrictamente decreciente en $\ell$ porque $0<\alpha<1$ y $w(e)\ge 0$. Por lo tanto

$$\max_{\ell \,:\, \exists \text{ ruta de longitud } \ell} c(e,\ell) = c\big(e, d(e)\big),$$

la ruta más corta. Así que basta con conocer $d(e)$ - ninguna otra ruta puede superarla.

## Afirmación 2 - el BFS calcula $d(e)$, por inducción sobre niveles

Sea $L_k = \{ u : d(u) = k \}$. El BFS con una cola FIFO y "marcar en el primer descubrimiento" encola los nodos en orden no decreciente de distancia.

- **Base.** $L_0 = \{r\}$; la cola inicia como $[r]$ a distancia $0$.
- **Paso.** Supongamos que cada nodo de $L_0,\dots,L_k$ se ha encolado exactamente una vez con su distancia correcta, todos antes que cualquier nodo de $L_{k+1}$. Tomemos $v \in L_{k+1}$. Por definición de distancia más corta existe $u \in L_k$ con $v \in \text{proveedores}(u)$. Cuando se procesa $u$ (distancia $k$), $v$ o bien ya está marcado - solo posible desde otro predecesor a distancia $k$, es decir, sigue siendo distancia $k+1$ - o se marca ahora a distancia $k+1$. En cualquier caso $v$ queda registrado con distancia $k+1$, y no pudo haberse marcado antes, pues eso requeriría un predecesor a distancia $< k$, contradiciendo $d(v)=k+1$.

Por inducción, cada nodo alcanzable se registra una vez con distancia $d(\cdot)$.

## El corte de profundidad preserva la corrección hasta la cota

Detener la expansión en `maxDepth = D` (no expandir nodos que ya están a distancia $D$) omite exactamente los EFOS con $d(e) > D$. Por la Afirmación 1 cada aporte omitido es a lo más $\alpha^{D+1}$, y la cota de la cola geométrica ([geometric-convergence.es.md](./geometric-convergence.es.md)) acota su total. Dentro de la profundidad $D$ el resultado es exacto.

## Consecuencia

Como el puntaje reportado de cada EFOS es igual a su verdadero máximo sobre todas las rutas, el `max` de la raíz sobre esos puntajes es igual al verdadero riesgo máximo atenuado sobre todas las rutas de raíz a EFOS dentro del presupuesto de profundidad. $\blacksquare$
