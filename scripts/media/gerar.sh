#!/bin/sh
# Generates the landing page media on the VPS (Gemini key lives there). Images use the cheapest image model via
# gemini-ref.py; every scene takes the house truck (black Volvo VM, white box with the RJ Lima logo) as reference.
cd /root/prospeccao/rjlima
G="python3 /root/prospeccao/gemini-ref.py"
T="Keep the truck EXACTLY like the reference image: black Volvo VM cab, white aluminium box body with the RJ Lima Transportes logo (black script 'RJ Lima' with a red J, black band 'TRANSPORTES', yellow and black road swoosh). Photorealistic, natural colors, premium commercial photography, 35mm film look, subtle grain. Southern Minas Gerais, Brazil: rolling green hills, coffee plantations, red earth, small colonial towns. No other text, no watermarks, no extra logos, no people facing the camera."

$G 16:9 serra.png "$T Scene: wide cinematic shot at golden hour, the truck driving on a winding two-lane asphalt road that curves through coffee plantation hills, Serra da Mantiqueira ridges layered in blue haze behind, low warm sun from the left, long shadows, light dust. The truck occupies the right third, the left two thirds are calm sky and hills (room for a headline)." truck.png > log-serra 2>&1 &
$G 9:16 serra-vertical.png "$T Scene: vertical cinematic shot at golden hour, the truck on a winding road through coffee hills seen from slightly above, the road curving from the bottom towards the hills, truck in the lower half, calm sky and hills in the upper third." truck.png > log-serra-v 2>&1 &
$G 16:9 doca.png "$T Scene: early morning at the loading dock of a small regional distributor in a Minas Gerais town, the truck backed up to the dock with the rear doors open, two workers in plain grey work uniforms (seen from behind and side) loading stacked cardboard boxes with a pallet jack, soft side light, clean concrete floor." truck.png > log-doca 2>&1 &
$G 16:9 cidade.png "$T Scene: the truck parked on a cobblestone street of a small historic Minas Gerais town, white colonial houses with coloured window frames, a baroque church tower in the background, late afternoon light, a delivery worker (from behind) carrying a box to a shop door." truck.png > log-cidade 2>&1 &
$G 16:9 noite.png "$T Scene: blue hour on a Brazilian federal highway (BR) crossing the hills, the truck with headlights and marker lights on, long exposure light trails from other vehicles, dark silhouetted hills, deep blue sky with the last orange light on the horizon." truck.png > log-noite 2>&1 &
$G 16:9 cafezal.png "$T Scene: aerial drone shot looking down at an angle over neat rows of a coffee plantation, a red dirt farm road cuts through the rows and the truck drives on it, morning light, rich greens and red earth." truck.png > log-cafezal 2>&1 &
$G 4:5 carga.png "Photorealistic interior of the white box body of a delivery truck, stacked cardboard boxes of different sizes wrapped in stretch film, ratchet straps holding them, shipping labels on the boxes (no readable text), strong warm light coming from the open rear doors, shallow depth of field, premium commercial photography." > log-carga 2>&1 &
wait
cat log-*
