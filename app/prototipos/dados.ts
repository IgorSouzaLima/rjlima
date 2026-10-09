// The prototypes read the same facts as the live home page.
import { MEDIA, type Cover } from '../../lib/site-data';

export * from '../../lib/site-data';

/** The prototypes keep the original cover rotation (the live home page always shows the night film). */
export function pickCover(vertical: boolean): Cover {
  const serra = vertical ? MEDIA.videoSerraVertical : MEDIA.videoSerra;
  return Math.random() < 0.5 ? serra : MEDIA.videoNoite;
}
