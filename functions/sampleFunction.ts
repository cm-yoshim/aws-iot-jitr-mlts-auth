export const handler = async(): Promise<{statusCode: number; body: string}> => {
    try {
        const res = {
            statusCode: 200,
            body: '{"message": "Good."}',
        };
        return res;
    } catch (error: unknown) {
        console.log({error})
        throw new Error('Failed in handler.');
    }
};
