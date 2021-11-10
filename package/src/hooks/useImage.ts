import type { ImageSourcePropType } from "react-native";
import { useMemo, useState } from "react";

import type { IImage } from "../skia/Image";
import { Api } from "../skia/Api";
import { ScaleToFit } from "../skia/Matrix";
import { TileMode } from "../skia/ImageFilter";

/**
 * Returns a Skia Image object
 * */
export const useImage = (source: ImageSourcePropType) => {
  const [image, setImage] = useState<IImage>();
  useMemo(
    () =>
      Api.Image(source).then((value) => {
        setImage(value);
      }),
    [source]
  );
  return image;
};

interface Dimension {
  width: number;
  height: number;
}

// These behave like https://reactnative.dev/docs/image#resizemode
export type ResizeMode = "cover" | "contain" | "stretch" | "center" | "repeat";

const resize = (image: Dimension, container: Dimension, mode: ResizeMode) => {
  const containerImgWidthRatio = container.width / image.width;
  const containerImgHeightRatio = container.height / image.height;
  const m = Api.Matrix();
  switch (mode) {
    case "cover": {
      const scale = Math.max(containerImgWidthRatio, containerImgHeightRatio);
      if (containerImgWidthRatio > containerImgHeightRatio) {
        const c = container.height;
        const i = image.height * scale;
        const tr = (c - i) / 2;
        m.setTranslateY(tr);
      } else {
        const c = container.width;
        const i = image.width * scale;
        const tr = (c - i) / 2;
        m.setTranslateX(tr);
      }
      m.setScaleX(scale);
      m.setScaleY(scale);
      break;
    }
    case "center": {
      m.setRectToRect(
        Api.Rect(0, 0, image.width, image.height),
        Api.Rect(0, 0, container.width, container.height),
        ScaleToFit.Center
      );
      break;
    }
    case "stretch": {
      m.setScaleX(containerImgWidthRatio);
      m.setScaleY(containerImgHeightRatio);
      break;
    }
    case "contain": {
      const scale = Math.min(containerImgWidthRatio, containerImgHeightRatio);
      m.setScaleX(scale);
      m.setScaleY(scale);
      break;
    }
    default:
    // do nothing
  }
  return m;
};

export const useImageShader = (
  source: ImageSourcePropType,
  container: Dimension,
  resizeMode: ResizeMode = "cover"
) => {
  const image = useImage(source);
  if (image) {
    const tileMode = resizeMode === "repeat" ? TileMode.Repeat : TileMode.Decal;
    return image.makeShader(
      tileMode,
      tileMode,
      resize(image, container, resizeMode)
    );
  }
  return undefined;
};