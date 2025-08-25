const authHeader = 'Basic ' + Buffer.from(`${process.env.JU}:${process.env.JP}`).toString('base64');

export const getAttachmentURL = async (reqPath: string) => {
  try {
    const res = await fetch(reqPath, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
    });

    if (!res.ok)
      throw new Error(`Failed to fetch attachment metadata: ${res.status} ${res.statusText}`);

    const data = await res.json();
    return data.content;
  } catch (err) {
    console.error('❌ Error fetching attachment:', err);
    throw err;
  }
};
