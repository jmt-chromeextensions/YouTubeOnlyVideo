/*
This JS file functions as a resource file for all the SVG icons used by the extension. 
They are stored this way instead of in individual SVG files to make adding them to the
DOM and maninpulating their components via JavaScript easier.

There may be more proper methods to do this, but I thought this one was fine for this
extension's characteristics.
*/

// Fullscreen switch button
const FULLS_SVG = 
`<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
width="55pt" height="28pt" viewBox="0 0 120 143"
preserveAspectRatio="xMidYMid meet">

<g transform="translate(0.000000,143.000000) scale(0.100000,-0.100000)">
<path d="M30 1085 l0 -295 45 0 45 0 0 250 0 250 260 0 260 0 0 45 0 45 -305
0 -305 0 0 -295z"/>
<path d="M960 1335 l0 -45 260 0 260 0 0 -250 0 -250 45 0 45 0 0 295 0 295
-305 0 -305 0 0 -45z"/>
<path d="M30 335 l0 -295 305 0 305 0 0 45 0 45 -260 0 -260 0 0 250 0 250
-45 0 -45 0 0 -295z"/>
<path d="M1480 380 l0 -250 -260 0 -260 0 0 -45 0 -45 305 0 305 0 0 295 0
295 -45 0 -45 0 0 -250z"/>
</g>
</svg>`

// Instant dynamic color change button
const BOLT_SVG = 
`<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
width="55pt" height="28pt" viewBox="0 0 180 143" fill="white"
preserveAspectRatio="xMidYMid meet">

<g transform="translate(0.000000,143.000000) scale(0.100000,-0.100000)">
<path d="M815 1074 c-110 -162 -201 -301 -203 -308 -2 -8 3 -18 10 -23 7 -4
109 -10 226 -13 l213 -5 -58 -85 c-32 -47 -129 -181 -216 -297 -157 -211 -179
-253 -137 -260 11 -3 998 751 1044 797 6 6 5 19 -2 35 l-12 25 -215 0 c-118 0
-215 2 -215 5 0 3 52 88 116 190 77 123 114 192 112 207 l-3 23 -230 2 -230 2
-200 -295z"/>
</g>
</svg>`

// 'Soft' dynamic color change button
const FAT_WIND_SVG = 
`<svg version="1.0" xmlns="http://www.w3.org/2000/svg" 
width="58pt" height="28pt" viewBox="0 5 170 110"
fill="white" preserveAspectRatio="xMidYMid meet">

<g transform="translate(0.000000,144.000000) scale(0.100000,-0.100000)">
<path d="M1270 1263 c-106 -8 -263 -38 -462 -87 -264 -67 -371 -82 -469 -67
-39 6 -88 20 -109 31 -51 26 -75 25 -94 -2 -33 -47 -13 -76 74 -109 142 -54
280 -45 631 41 286 71 366 83 524 83 141 -1 244 -20 366 -69 100 -39 110 -41
132 -16 22 24 22 55 0 74 -28 23 -136 66 -225 89 -69 17 -280 42 -313 37 -5
-1 -30 -3 -55 -5z"></path>
<path d="M1280 923 c-106 -8 -263 -38 -462 -87 -264 -67 -371 -82 -469 -67
-39 6 -88 20 -109 31 -51 26 -75 25 -94 -2 -33 -47 -13 -76 74 -109 142 -54
280 -45 631 41 286 71 366 83 524 83 141 -1 244 -20 366 -69 100 -39 110 -41
132 -16 22 24 22 55 0 74 -28 23 -136 66 -225 89 -69 17 -280 42 -313 37 -5
-1 -30 -3 -55 -5z"></path>
<path d="M1270 583 c-106 -8 -263 -38 -462 -87 -264 -67 -371 -82 -469 -67
-39 6 -88 20 -109 31 -51 26 -75 25 -94 -2 -33 -47 -13 -76 74 -109 142 -54
280 -45 631 41 286 71 366 83 524 83 141 -1 244 -20 366 -69 100 -39 110 -41
132 -16 22 24 22 55 0 74 -28 23 -136 66 -225 89 -69 17 -280 42 -313 37 -5
-1 -30 -3 -55 -5z"></path>
</g>
</svg>`

// 'Soft' dynamic color change button (fit one; not used)
const WIND_SVG = 
`<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
width="55pt" height="28pt" viewBox="0 0 180 143"
preserveAspectRatio="xMidYMid meet">

<g transform="translate(0.000000,143.000000) scale(0.100000,-0.100000)">
<path d="M1600 1318 c-89 -31 -182 -96 -330 -229 -69 -61 -155 -135 -191 -164
-256 -206 -516 -308 -884 -348 -99 -11 -110 -14 -110 -32 0 -18 6 -20 75 -18
176 6 411 59 579 132 174 75 325 179 556 386 219 196 310 245 451 245 42 0
103 -7 136 -16 62 -16 86 -10 75 18 -8 23 -77 40 -187 44 -91 4 -114 2 -170
-18z"/>
<path d="M1690 1088 c-89 -31 -182 -96 -330 -229 -69 -61 -155 -135 -191 -164
-256 -206 -516 -308 -884 -348 -99 -11 -110 -14 -110 -32 0 -18 6 -20 75 -18
176 6 411 59 579 132 174 75 325 179 556 386 219 196 310 245 451 245 42 0
103 -7 136 -16 62 -16 86 -10 75 18 -8 23 -77 40 -187 44 -91 4 -114 2 -170
-18z"/>
<path d="M1760 868 c-89 -31 -182 -96 -330 -229 -69 -61 -155 -135 -191 -164
-256 -206 -516 -308 -884 -348 -99 -11 -110 -14 -110 -32 0 -18 6 -20 75 -18
176 6 411 59 579 132 174 75 325 179 556 386 219 196 310 245 451 245 42 0
103 -7 136 -16 62 -16 86 -10 75 18 -8 23 -77 40 -187 44 -91 4 -114 2 -170
-18z"/>
</g>
</svg>`