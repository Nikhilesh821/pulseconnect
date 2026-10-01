/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    images:{
        remotePatterns:[{
            hostname:"res.cloudinary.com"
        },{
            hostname:"ui-avatars.com"
        }]
    }
};


export default nextConfig;
