import { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json({
    success: false,
    message: 'API NOT FOUND!',
    errorSources: [
      {
        path: req.originalUrl,
        message: `Cannot ${req.method} ${req.originalUrl}`,
      },
    ],
  });
};

export const NotFound = notFound;
export default notFound;
