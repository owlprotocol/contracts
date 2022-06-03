import express, { Request, Response, NextFunction } from 'express';
import createError, { HttpError, NotFound } from 'http-errors';
import { metadataRouter } from './routes';

//App config
const app = express();
const port = process.env.PORT || 8000;

//Middlewares
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('Server Up');
});

app.use('/metadata', metadataRouter);

app.use(async (req, res, next) => {
    next(new NotFound());
});

//Error handling middleware
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message,
        },
    });
});

//Listener
app.listen(port, () => console.log(`listening on port ${port}`));
