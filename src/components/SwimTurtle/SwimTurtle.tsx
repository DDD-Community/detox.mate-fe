import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

type SwimTurtleProps = {
  size?: number;
};

const NATIVE_WIDTH = 35.2033;
const NATIVE_HEIGHT = 34.7829;

export function SwimTurtle({ size = NATIVE_WIDTH }: SwimTurtleProps) {
  const height = (size / NATIVE_WIDTH) * NATIVE_HEIGHT;

  return (
    <Svg width={size} height={height} viewBox={`0 0 ${NATIVE_WIDTH} ${NATIVE_HEIGHT}`} fill="none">
      <G>
        <Path
          d="M30.769 12.3689C33.2179 9.91996 33.4269 6.15844 31.2358 3.96729C29.0446 1.77614 25.2831 1.98512 22.8342 4.43405C21.8774 5.39078 21.2626 6.54784 20.9991 7.73334L27.4697 14.2039C28.6552 13.9405 29.8123 13.3256 30.769 12.3689Z"
          fill="url(#paint0_linear)"
        />
        <Path
          d="M16.8287 7.55337C16.3054 5.72485 14.7723 4.40096 12.9626 4.40096C11.1529 4.40096 9.61985 5.72485 9.0965 7.55337C8.88361 8.29721 9.53151 8.93672 10.3052 8.93672H15.62C16.3937 8.93672 17.0416 8.29721 16.8287 7.55337Z"
          fill="url(#paint1_linear)"
        />
        <Path
          d="M8.47023 15.5935C7.49146 13.9627 5.668 13.0807 3.91995 13.5491C2.17191 14.0175 1.03375 15.6931 1.00149 17.5947C0.988365 18.3683 1.77971 18.8184 2.52706 18.6181L7.66073 17.2425C8.40808 17.0423 8.86839 16.2569 8.47023 15.5935Z"
          fill="url(#paint2_linear)"
        />
        <Path
          d="M19.1894 26.3125C20.8202 27.2912 21.7022 29.1147 21.2338 30.8627C20.7654 32.6108 19.0898 33.7489 17.1882 33.7812C16.4146 33.7943 15.9646 33.003 16.1648 32.2556L17.5404 27.1219C17.7406 26.3746 18.526 25.9143 19.1894 26.3125Z"
          fill="url(#paint3_linear)"
        />
        <Path
          d="M27.9948 18.7194C29.8233 19.2428 31.1472 20.7758 31.1472 22.5855C31.1472 24.3952 29.8233 25.9283 27.9948 26.4516C27.2509 26.6645 26.6114 26.0166 26.6114 25.2429V19.9281C26.6114 19.1544 27.2509 18.5065 27.9948 18.7194Z"
          fill="url(#paint4_linear)"
        />
        <Path
          d="M13.1984 8.06805C16.8442 4.42229 22.7552 4.42228 26.401 8.06805L27.2011 8.86821C30.8469 12.514 30.8469 18.4249 27.2011 22.0707L20.4665 28.8053C20.0982 29.1736 19.5012 29.1736 19.1329 28.8053L15.0126 24.685C14.795 24.4674 14.4849 24.3697 14.1819 24.4231L11.4821 24.8996C10.8307 25.0145 10.2665 24.4406 10.3925 23.7913L10.9026 21.1625C10.9623 20.8548 10.8652 20.5376 10.6436 20.3161L6.46383 16.1363C6.09557 15.768 6.09557 15.1709 6.46383 14.8027L13.1984 8.06805ZM11.5981 15.4028C11.2299 15.771 11.2299 16.3681 11.5981 16.7364L18.5328 23.671C18.9011 24.0393 19.4981 24.0393 19.8664 23.671L23.3337 20.2037C25.6169 17.9205 25.6169 14.2187 23.3337 11.9355C21.0505 9.65225 17.3487 9.65225 15.0655 11.9355L11.5981 15.4028Z"
          fill="#FFFFFF"
        />
        <Path
          d="M18.9207 12.755C18.9209 14.5481 20.3608 16.0032 22.1472 16.0314L22.1463 16.0343C20.378 16.0626 18.9501 17.4906 18.9217 19.2589L18.9197 19.2599C18.8915 17.4733 17.4356 16.0333 15.6424 16.0333C17.4531 16.0333 18.9205 14.5657 18.9207 12.755Z"
          fill="#FFFFFF"
        />
      </G>
      <Defs>
        <LinearGradient id="paint0_linear" x1="31.017" y1="3.7485" x2="22.7708" y2="9.91601">
          <Stop offset="0.4" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.5} />
        </LinearGradient>
        <LinearGradient id="paint1_linear" x1="11.643" y1="4.41293" x2="14.4184" y2="7.82873">
          <Stop offset="0.6" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.5} />
        </LinearGradient>
        <LinearGradient id="paint2_linear" x1="1.60903" y1="15.7276" x2="7.02626" y2="15.7276">
          <Stop offset="0.6" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.5} />
        </LinearGradient>
        <LinearGradient id="paint3_linear" x1="20.0936" y1="26.3557" x2="19.7823" y2="33.6605">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
          <Stop offset="0.600962" stopColor="#FFFFFF" />
        </LinearGradient>
        <LinearGradient id="paint4_linear" x1="28.8793" y1="18.5272" x2="32.8583" y2="21.9188">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
          <Stop offset="0.6" stopColor="#FFFFFF" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
