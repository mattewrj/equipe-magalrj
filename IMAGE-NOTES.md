# Imagens desta versão

## Fotos do rolo da equipe

Dez imagens diferentes fornecidas em 14/09/2026 foram codificadas em WebP, sem IA, retoques, alteração de pessoas ou ampliação. Os onze anexos continham uma duplicata exata (entradas 3 e 9). Os arquivos finais são `dist/images/equipe-galeria/foto-01.webp` até `foto-10.webp`, com miniaturas `foto-01-thumb.webp` até `foto-10-thumb.webp`.

Os arquivos completos mantêm as dimensões originais, até 1600 pixels; miniaturas têm lado maior de até 640 pixels. A galeria usa recorte visual nas molduras e exibe a imagem inteira no diálogo. Não há títulos descritivos por foto; os textos alternativos apenas descrevem elementos visíveis. Origem, hashes, dimensões e pesos estão registrados em `.qa/gallery-assets.md`, fora da pasta publicada.

## Equipe Magalhães e Wellington José

- Original preservado: `dist/images/equipe-magalhaes.png`.
- Restauração produzida pelo gerador integrado de imagens: `dist/images/equipe-magalhaes-restaurada.png`, 1122 × 1402.
- Versão web com a mesma resolução: `dist/images/equipe-magalhaes-hd.webp` (qualidade 94, aproximadamente 272 KB).
- A restauração usa IA: melhora a aparência e a definição, mas não representa recuperação factual de detalhes que não existiam no original. O enquadramento e o texto alternativo identificam a edição. Não foi usado o modo CLI/API.

Prompt aplicado:

> Use case: identity-preserve. Asset type: high-resolution photographic portrait for a website hero. Edit target: the attached existing photograph of two men. Primary request: produce a carefully restored, photorealistic higher-resolution version of this exact two-person photograph. Preserve their identities, true age, facial geometry, expressions, skin tones, hair, clothing and relative positioning faithfully: left man bald with black glasses, smiling, in a navy polo; right man older with short grey hair, neutral expression, in a turquoise T-shirt. Keep the original natural photographic appearance; reduce visible JPEG compression and excessive blur, gently improve clarity and illumination without beautification. Remove the electoral lettering from the blue background and remove the decorative green/yellow ribbons at the bottom, replacing them only with clean continuation of the blue background or the actual clothing where necessary. Composition: square or 4:5 bust portrait, both men visible together with faces unobstructed, neither head cropped, good breathing room above the heads; no need to invent lower bodies. Render at the highest practical resolution with natural skin texture. Strict invariants: do not alter age, expression, face shape, facial proportions, eye color, skin tone, glasses, hair, clothing, or relative body pose; no rejuvenation, smoothing, face enhancement, glamour retouching, exaggerated features, new people, new props, text, slogans or watermark. This is a faithful photograph restoration, not a new scene.

## Magalhães de terno — imagem atual do início

- Edição solicitada pelo usuário em 14/09/2026: substituir a camiseta de Magalhães, à direita, por terno azul-marinho, camisa branca e gravata discreta.
- Ferramenta: `image_gen` integrado (modo built-in), sem CLI/API.
- Alvo da edição: `dist/images/equipe-magalhaes-restaurada.png`.
- Resultado preservado em `dist/images/equipe-magalhaes-terno.png`, 1122 × 1402.
- Arquivo usado no site: `dist/images/equipe-magalhaes-terno.webp`, mesma resolução, qualidade 94, 218.190 bytes.
- As versões anteriores permanecem disponíveis. O texto alternativo da imagem identifica a alteração digital da roupa.

Prompt aplicado:

> Use case: identity-preserve. Asset type: photographic portrait used in an existing website. Input image 1 is the EDIT TARGET, not merely a reference. Make a very localized wardrobe edit to this exact two-person photograph: replace ONLY the turquoise T-shirt worn by Magalhães, the older Black man with short gray hair on the RIGHT, with a well-fitting dark navy business suit jacket, crisp white dress shirt and a subtle dark navy tie. Render realistic lapels, seams, folds and fabric texture that match the existing lighting and his current posture and body proportions. Keep the neck, head, face, skin tone, natural wrinkles, gray hair, expression, gaze and facial identity of the right man exactly as in the source. Keep the left man in his original blue polo entirely unchanged, including all facial details, smile and glasses. Preserve the original blue background, original framing and image aspect ratio, relative positions, camera perspective, scale, lighting and colors everywhere outside the right man's clothing. Preserve the existing exposed skin at his neckline naturally at the new shirt collar. Do not modify, beautify, retouch, rejuvenate or reinterpret either face. Do not add people, accessories other than the requested suit/shirt/tie, badges, flags, writing, logos or watermarks. No face enhancement. The only intended visible change is the right man's formal clothing. Produce a clean high-resolution photorealistic edit at the same 4:5 portrait composition as the supplied image.

## Retrato oficial de Wellington José

- Original publicado no site indicado: `dist/images/wellington-oficial.jpg`, 1920 × 1280.
- Versão web com a mesma resolução: `dist/images/wellington-oficial-hd.webp` (qualidade 93, aproximadamente 349 KB).
- Essa imagem não foi gerada nem restaurada com IA; houve somente codificação WebP para reduzir o peso.
- Fonte: https://deputadowellingtonjose.lovable.app/__l5e/assets-v1/2d9e4187-85a3-4f8d-9a4e-3b3d664aeeab/wellington-jose.jpg

## Marcas dos candidatos

As duas artes fornecidas pelo usuário foram preservadas em `dist/images/wellington-4479.png` e `dist/images/canella-44444.png`.

O cabeçalho usa agora `dist/images/wellington-wordmark.svg` e `dist/images/canella-wordmark.svg`: composições tipográficas vetoriais recriadas com os mesmos nomes, números e cargos, com fundo transparente. As letras foram convertidas em contornos, sem dependência de fontes externas, imagens rasterizadas ou geração por IA. A nitidez é preservada em qualquer escala. Não são arquivos vetoriais oficiais fornecidos pelos candidatos.

O script local `build-wordmarks.ps1` permite regenerar os contornos com System.Drawing e Arial do Windows. Os SVGs prontos são estáticos e não dependem desse script para funcionar no site.
