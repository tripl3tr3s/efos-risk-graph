# Convergencia geométrica y el corte de profundidad

[English](./geometric-convergence.md) · **Español**

Truncar el BFS en 2 o 3 niveles suele tratarse como un truco de rendimiento. No lo es: con atenuación es una aproximación cuantificada cuya masa descartada está acotada por la cola de una serie geométrica.

## La cota

Todo peso base cumple $w(e) \le 1$, así que un EFOS a profundidad $k$ aporta a lo más $\alpha^{k}$. El riesgo total del peor caso oculto más allá de la profundidad $D$ - incluso si *cada* nodo más profundo fuera un Definitivo confirmado - está acotado por

$$T(D) = \sum_{k=D+1}^{\infty} \alpha^{k} = \alpha^{D+1}\sum_{j=0}^{\infty}\alpha^{j} = \frac{\alpha^{\,D+1}}{1-\alpha}.$$

La suma converge precisamente porque $0 < \alpha < 1$. Como el motor reporta un **máximo**, la omisión real es aún menor que $T(D)$ (un solo término, no la suma) - $T(D)$ es una cota superior generosa.

## Números para $\alpha = 0.5$

$$T(1) = \frac{0.5^{2}}{0.5} = 0.5,\quad T(2) = \frac{0.5^{3}}{0.5} = 0.25,\quad T(3) = \frac{0.5^{4}}{0.5} = 0.125,\quad T(4) = 0.0625.$$

| corte $D$ | máximo puntaje aún alcanzable en $D{+}1$ | cota de cola $T(D)$ |
|-----------|--------------------------------------|-------------------|
| 1         | $0.25$                               | $0.5$             |
| 2         | $0.125$                              | $0.25$            |
| 3         | $0.0625$                             | $0.125$           |

Un EFOS confirmado a cuatro saltos puede mover el puntaje a lo más $0.0625$ - por debajo de cualquier umbral de alerta razonable. Así que `maxDepth = 2` o `3` captura esencialmente toda la masa de riesgo, y la elección de $\alpha$ fija directamente qué tan rápido colapsa esa cola.

## Elegir alpha a partir de un horizonte objetivo

Si quieres que la distancia $H$ sea el punto donde un Definitivo solitario cae por debajo de un umbral $\tau$, resuelve $\alpha^{H} \le \tau$:

$$\alpha \le \tau^{1/H}.$$

Para $\tau = 0.1$ en $H = 3$: $\alpha \le 0.1^{1/3} \approx 0.464$. Esa es la justificación formal para usar por defecto $\alpha = 0.5$ con una profundidad de 2-3.
