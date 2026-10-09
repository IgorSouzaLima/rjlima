// The Baú display and text face, shared by every page that wears the livery.
import { Archivo } from 'next/font/google';

export const archivo = Archivo({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--bau-font', display: 'swap' });
