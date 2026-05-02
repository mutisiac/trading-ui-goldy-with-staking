import type { Request, Response } from "express";
import {
  createNewsDoc,
  deleteNewsById,
  updateNewsById,
} from "../repositories/news.repository.js";
import type {
  CreateNewsBody,
  UpdateNewsBody,
} from "../validation/news.schemas.js";
import { pathParam } from "../utils/route-params.utils.js";

export async function createNews(req: Request, res: Response): Promise<Response> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required in order to create news.",
      });
    }

    const body = req.body as CreateNewsBody;

    const newNews = await createNewsDoc({
      title: body.title,
      description: body.description,
      status: body.status,
      createdBy: user._id,
    });

    return res.status(201).json({
      success: true,
      message: "News created successfully",
      data: newNews,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return res.status(500).json({
      success: false,
      message: "Error creating news",
      error: errorMessage,
    });
  }
}

export async function updateNews(req: Request, res: Response): Promise<Response> {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required in order to update news.",
      });
    }

    const newsId = pathParam(req.params.newsId);
    const body = req.body as UpdateNewsBody;

    const updatedNews = await updateNewsById(newsId, body);
    if (!updatedNews) {
      return res.status(404).json({
        success: false,
        message: "News not found ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News updated successfully",
      data: updatedNews,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return res.status(500).json({
      success: false,
      message: "Error updating news",
      error: errorMessage,
    });
  }
}

export async function deleteNews(req: Request, res: Response): Promise<Response> {
  try {
    const newsId = pathParam(req.params.newsId);

    const news = await deleteNewsById(newsId);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News deleted successfully",
      data: news,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return res.status(500).json({
      success: false,
      message: "Error deleting news",
      error: errorMessage,
    });
  }
}
