# Project Overview: Spatiotemporal Multivariate Datasets

You will carry out assignments 1 and 2 on the same dataset. You can choose from one of two datasets we provide. The datasets share structural characteristics, i.e., they are all spatiotemporal and multivariate. Which dataset you choose does not influence the type of tasks or how we grade your submissions, so you may choose it by personal interest only. The available datasets are:

## Available Datasets

- **ArtVis: Artists and their exhibitions**
- **AniVision: Animation films**

## Dataset Options Overview

### ArtVis: Artists and their Exhibitions
- Data contains records about artists, their exhibition dates, locations, and potentially other related attributes like nationality, gender, or exhibition scale.

### AniVision: Animation Films
- This dataset features records related to animated films, which may include release dates, production companies, countries, genres, and viewer demographics.

## Choosing the Right Dataset
Choose based on personal interest:
- If you have an interest in visual arts, galleries, or the history of exhibitions, **ArtVis** would be engaging.
- If you're more intrigued by animated film trends and filmography, **AniVision** could be more appealing.

## Strategies for Simplifying the Data
Given the spatiotemporal and multivariate nature of these datasets, you’ll likely need to simplify to effectively visualize the information. Here are strategies:

### Temporal Simplification
- **Select a specific time interval**: Focus on a specific range, such as a decade.
- **Aggregate by year**: Summarize data into annual counts or trends.

### Spatial Simplification
- **Select a smaller region**: For **ArtVis**, this could mean focusing on exhibitions in Europe or Asia, while for **AniVision**, it could mean focusing on films produced in specific countries.
- **Aggregate by spatial hierarchy**: Analyze by city, country, or continent to see how exhibitions or film productions are distributed.

### Data Case Simplification
- **Select a subset of cases**: For **ArtVis**, this could include focusing only on female artists or artists of a certain nationality. For **AniVision**, you could choose films from specific genres or those released by major studios.
- **Aggregate by data subsets**: Visualize the number of exhibitions by gender over time or compare the number of animated films released by genre.

## Considerations for Assignments
Ensure the following elements are included:
- **Temporal component**: Your visualization must show changes or trends over time.
- **Simplified/aggregated spatial component**: The space aspect of the data should be condensed, either by focusing on specific regions or by grouping regions.
- **Single or grouped data cases**: Choose to show individual cases (e.g., one artist’s exhibition history) or aggregate data (e.g., total exhibitions by all artists per year).

## Examples of Visualization Ideas
- **ArtVis**:
  - A time series plot showing the number of exhibitions held annually in major cities.
  - A map displaying the locations of exhibitions over time, colored by gender representation.
  
- **AniVision**:
  - A bar chart comparing the number of animated films released per year by genre.
  - A geographic visualization of film production locations over a selected time period.

## Assignment Deliverables
- **Assignment 1**: Initial exploration with a basic visualization that incorporates temporal changes.
- **Assignment 2**: A more comprehensive visualization that aggregates spatial data and looks at specific data subsets.

Choose the dataset based on your interest, outline your analysis strategy, and decide how you’ll simplify the data to tell a meaningful story over time.


# ArtVis: Artists and Their Exhibitions

The ArtVis dataset is derived from the Database of Modern Exhibitions (DoME) [1] from the University of Vienna. It contains about **14,000 modern painters** and their exhibitions between **1905 and 1915**.

We provide a CSV file (see below) with all the painters and the exhibitions they participated in. The dataset contains multiple rows per artist, with each row linking the artist to a different exhibition and detailing how many paintings the artist exhibited in that exhibition.

## Important Facts About the Data in the CSV File

- Artist properties start with an `a.`, while exhibition properties start with an `e.`
- The gender of an artist (`a.gender`) can be either **"M"** or **"F"**
- There might be uncertainty in the birth and death dates (`a.birthdate`, `a.deathdate`) of the artists, i.e., missing months or days (e.g., `"1866-01-01"`). It is acceptable to use only the years and leave out days and months.
- The exhibition type (`e.type`) might be **group**, **solo**, or **auction**. In group exhibitions and auctions, multiple artists are featured, while in solo exhibitions, only one artist exhibits their paintings.
- `e.paintings` denotes the number of paintings an artist exhibited in a certain exhibition.
- Be careful about the format of the exhibitions' latitude and longitude columns (`e.latitude`, `e.longitude`) when importing the CSV into other programs. Check if they are still correct; otherwise, you might get incorrect positions on a map.

For more information on the dataset and examples, see the dataset lecture slides.

[1] BARTOSCH C., MULLOLI N., BURCKHARDT D., DÖHRING M., AHMAD W., ROSENBERG R.: The database of modern exhibitions (DoME): European paintings and drawings 1905-1915. Routledge, 2020, ch. 30, pp. 423–434.
