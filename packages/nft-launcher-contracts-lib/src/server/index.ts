import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan'
import { HttpError, NotFound } from 'http-errors';
import { existsSync, mkdir } from 'fs';
import { metadataRouter } from './routes';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

//App config
const app = express();
const port = process.env.PORT || 8000;

//Middlewares
app.use(express.json());
app.use(morgan('tiny'));

app.get('/', (req, res) => {
    res.status(200).send('Server Up');
});

app.use('/metadata', metadataRouter);

app.use(async (req, res, next) => {
    next(new NotFound());
});

const cacheDir = path.join(__dirname, '..', '..', '..', 'cache');
//create cache
if (!existsSync(cacheDir)) mkdir('./cache', () => { });

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
